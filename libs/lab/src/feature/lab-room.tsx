'use client';

import { useState } from 'react';
import '@livekit/components-styles';
import './mojo-lab-theme.css';
import {
  CarouselLayout,
  FocusLayout,
  FocusLayoutContainer,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useParticipants,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Badge } from '@mojo/shared/ui';
import type { FileStorageProvider, LabAccess } from '../domain/lab.types';
import { LabControlBar } from './lab-control-bar';
import { LabChatPanel } from './lab-chat-panel';
import { LabWhiteboard } from './lab-whiteboard';
import { LabFilePanel } from './lab-file-panel';

export interface LabRoomProps {
  sessionId: string;
  access: LabAccess;
  fileStorage: FileStorageProvider;
  onDisconnected?: () => void;
}

type Panel = 'chat' | 'whiteboard' | 'files' | null;

export function LabRoom({ sessionId, access, fileStorage, onDisconnected }: LabRoomProps) {
  const [panel, setPanel] = useState<Panel>(null);

  return (
    <div data-lk-theme="mojo" className="flex h-full flex-col rounded-lg border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-bold text-headline">Mojo Lab</span>
        <Badge variant="primary">live</Badge>
      </div>

      <LiveKitRoom
        token={access.participantToken}
        serverUrl={access.serverUrl}
        connect
        video
        audio
        onDisconnected={onDisconnected}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex flex-1 overflow-hidden">
          <RoomStage />
          {panel && (
            <div className="w-80 shrink-0 border-l border-border">
              {panel === 'chat' && <LabChatPanel />}
              {panel === 'whiteboard' && <LabWhiteboard />}
              {panel === 'files' && <LabFilePanel sessionId={sessionId} storage={fileStorage} />}
            </div>
          )}
        </div>

        <LabControlBarConnected panel={panel} setPanel={setPanel} onDisconnected={onDisconnected} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

/**
 * The one-to-many layout: whoever is screen-sharing (or, absent that, the
 * first camera track — a real build would rank by active-speaker instead)
 * gets the large FocusLayout tile, everyone else scrolls in the
 * CarouselLayout strip beside it. This is the same focus+filmstrip pattern
 * LiveKit's own prebuilt VideoConference uses — kept here instead of that
 * component only so the surrounding chrome can be Mojo's, not LiveKit's
 * defaults.
 */
function RoomStage() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  const screenShare = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const focusTrack = screenShare ?? tracks[0];
  const carouselTracks = tracks.filter((t) => t !== focusTrack);

  if (!focusTrack) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Waiting for video…</div>;
  }

  return (
    <FocusLayoutContainer className="flex-1">
      <CarouselLayout tracks={carouselTracks}>
        <ParticipantTile />
      </CarouselLayout>
      <FocusLayout trackRef={focusTrack} />
    </FocusLayoutContainer>
  );
}

function LabControlBarConnected({
  panel,
  setPanel,
  onDisconnected,
}: {
  panel: Panel;
  setPanel: (p: Panel) => void;
  onDisconnected?: () => void;
}) {
  const participants = useParticipants();
  const toggle = (p: Exclude<Panel, null>) => setPanel(panel === p ? null : p);

  return (
    <LabControlBar
      participantCount={participants.length}
      chatOpen={panel === 'chat'}
      whiteboardOpen={panel === 'whiteboard'}
      filesOpen={panel === 'files'}
      onToggleChat={() => toggle('chat')}
      onToggleWhiteboard={() => toggle('whiteboard')}
      onToggleFiles={() => toggle('files')}
      onLeave={() => onDisconnected?.()}
    />
  );
}
