'use client';

import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import '@livekit/components-styles';
import './mojo-lab-theme.css';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
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
import { Badge } from '@mojo/shared/ui';
import { Track } from 'livekit-client';
import type { FileStorageProvider, LabAccess } from '../domain/lab.types';
import { LabChatPanel } from './lab-chat-panel';
import { LabControlBar } from './lab-control-bar';
import { LabFilePanel } from './lab-file-panel';
import { HandRaiseOverlay, LabReactionsProvider, ReactionsOverlay } from './lab-reactions';
import {
  DEFAULT_VIDEO_ASPECT_ID,
  LAB_ROOM_OPTIONS,
  type VideoAspectId,
  videoAspect,
} from './lab-settings-panel';
import { LabWhiteboard } from './lab-whiteboard';

export interface LabRoomProps {
  sessionId: string;
  access: LabAccess;
  fileStorage: FileStorageProvider;
  onDisconnected?: () => void;
  /** Paid-plan entitlement — unlocks 1440p+ when the pricing model lands. */
  hasPlus?: boolean;
}

type Panel = 'chat' | 'whiteboard' | 'files' | null;

export function LabRoom({
  sessionId,
  access,
  fileStorage,
  onDisconnected,
  hasPlus = false,
}: LabRoomProps) {
  const [panel, setPanel] = useState<Panel>(null);
  const [videoAspectId, setVideoAspectId] = useState<VideoAspectId>(DEFAULT_VIDEO_ASPECT_ID);
  // The aspect select flows strings (matching the panel's <Select>), so cast
  // where the free-form value meets the constrained VideoAspectId state.
  const changeAspect = (id: string) => setVideoAspectId(id as VideoAspectId);

  return (
    <div
      data-lk-theme="mojo"
      className="flex h-full flex-col rounded-lg border border-border bg-background"
    >
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
        options={LAB_ROOM_OPTIONS}
        onDisconnected={onDisconnected}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <LabReactionsProvider>
          <div className="flex flex-1 overflow-hidden">
            <RoomStage aspectRatioId={videoAspectId} />
            {panel && (
              <div className="w-80 shrink-0 border-l border-border">
                {panel === 'chat' && <LabChatPanel />}
                {panel === 'whiteboard' && <LabWhiteboard />}
                {panel === 'files' && <LabFilePanel sessionId={sessionId} storage={fileStorage} />}
              </div>
            )}
          </div>

          <LabControlBarConnected
            panel={panel}
            setPanel={setPanel}
            onDisconnected={onDisconnected}
            aspectRatioId={videoAspectId}
            onAspectRatioChange={changeAspect}
            hasPlus={hasPlus}
          />
        </LabReactionsProvider>
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
 *
 * When a fixed aspect ratio is selected the focus tile is letterboxed: it is
 * measured (ResizeObserver) and the video centred inside a frame of exactly
 * that ratio, so 16:9/4:3/1:1 never stretch. "Dynamic" keeps LiveKit's
 * fill-the-stage behaviour.
 */
function RoomStage({ aspectRatioId }: { aspectRatioId: string }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    onlySubscribed: false,
  });
  const screenShare = tracks.find((t) => t.source === Track.Source.ScreenShare);
  const focusTrack = screenShare ?? tracks[0];
  const carouselTracks = tracks.filter((t) => t !== focusTrack);
  const frame = videoAspect(aspectRatioId);

  if (!focusTrack) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Waiting for video…
      </div>
    );
  }

  return (
    <FocusLayoutContainer className="relative flex-1">
      <CarouselLayout tracks={carouselTracks}>
        <ParticipantTile />
      </CarouselLayout>
      {frame ? (
        <LetterboxedTile trackRef={focusTrack} ratio={frame} />
      ) : (
        <FocusLayout trackRef={focusTrack} />
      )}
      <ReactionsOverlay />
      <HandRaiseOverlay />
    </FocusLayoutContainer>
  );
}

/** The focus-column grid track, filled then letterboxed to `ratio`. */
function LetterboxedTile({
  trackRef,
  ratio,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  ratio: { width: number; height: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useElementSize(ref);
  const fitted = width > 0 && height > 0 ? fitInto({ width, height }, ratio) : null;

  return (
    <div ref={ref} className="relative flex h-full items-center justify-center overflow-hidden">
      {fitted && (
        <div
          className="overflow-hidden rounded-lg"
          style={{ width: fitted.width, height: fitted.height }}
        >
          <ParticipantTile trackRef={trackRef} />
        </div>
      )}
    </div>
  );
}

/** Largest `target`-shaped box that fits inside `container`. */
function fitInto(
  container: { width: number; height: number },
  target: { width: number; height: number },
): { width: number; height: number } {
  const scale = Math.min(container.width / target.width, container.height / target.height);
  return {
    width: Math.round(target.width * scale),
    height: Math.round(target.height * scale),
  };
}

/** Track the rendered size of an element via ResizeObserver. */
function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

function LabControlBarConnected({
  panel,
  setPanel,
  onDisconnected,
  aspectRatioId,
  onAspectRatioChange,
  hasPlus,
}: {
  panel: Panel;
  setPanel: (p: Panel) => void;
  onDisconnected?: () => void;
  aspectRatioId: string;
  onAspectRatioChange: (id: string) => void;
  hasPlus: boolean;
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
      aspectRatioId={aspectRatioId}
      onAspectRatioChange={onAspectRatioChange}
      hasPlus={hasPlus}
    />
  );
}
