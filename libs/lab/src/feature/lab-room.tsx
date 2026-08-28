'use client';

import '@livekit/components-styles';
import './mojo-livekit-theme.css';
import { GridLayout, LiveKitRoom, ParticipantTile, RoomAudioRenderer, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Badge } from '@mojo/shared/ui';
import type { LabAccess } from '../domain/lab.types';

export interface LabRoomProps {
  access: LabAccess;
  onDisconnected?: () => void;
}

/**
 * Custom layout rather than LiveKit's <VideoConference/> prebuilt — Mojo
 * wants its own header/status treatment (design-system badges, not
 * LiveKit's default chrome), while still relying on LiveKit's hooks
 * (useTracks) for the actual media grid.
 */
export function LabRoom({ access, onDisconnected }: LabRoomProps) {
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
        className="flex-1"
      >
        <RoomView />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function RoomView() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}
