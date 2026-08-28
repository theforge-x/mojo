'use client';

import { Track } from 'livekit-client';
import { TrackToggle, useLocalParticipant } from '@livekit/components-react';
import {
  FileUp,
  MessageSquare,
  Mic,
  MicOff,
  PenTool,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import { cn } from '@mojo/shared/util';

export interface LabControlBarProps {
  participantCount: number;
  chatOpen: boolean;
  whiteboardOpen: boolean;
  filesOpen: boolean;
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onToggleFiles: () => void;
  onLeave: () => void;
}

/**
 * Custom control bar rather than LiveKit's prebuilt <ControlBar/> — every
 * button here is an icon (per the brief) styled with Mojo tokens, and the
 * three panel toggles (chat/whiteboard/files) are Mojo-specific concepts
 * LiveKit has no built-in button for.
 */
export function LabControlBar({
  participantCount,
  chatOpen,
  whiteboardOpen,
  filesOpen,
  onToggleChat,
  onToggleWhiteboard,
  onToggleFiles,
  onLeave,
}: LabControlBarProps) {
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <Users size={14} />
        {participantCount}
      </div>

      <div className="flex items-center gap-2">
        <TrackToggle source={Track.Source.Microphone} className={iconBtn()}>
          {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </TrackToggle>
        <TrackToggle source={Track.Source.Camera} className={iconBtn()}>
          {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </TrackToggle>
        <TrackToggle source={Track.Source.ScreenShare} className={iconBtn()}>
          {isScreenShareEnabled ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
        </TrackToggle>

        <div className="mx-1 h-6 w-px bg-border" />

        <IconButton active={chatOpen} onClick={onToggleChat} label="Chat">
          <MessageSquare size={18} />
        </IconButton>
        <IconButton active={whiteboardOpen} onClick={onToggleWhiteboard} label="Whiteboard">
          <PenTool size={18} />
        </IconButton>
        <IconButton active={filesOpen} onClick={onToggleFiles} label="Files">
          <FileUp size={18} />
        </IconButton>
      </div>

      <button
        type="button"
        onClick={onLeave}
        aria-label="Leave the lab"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:opacity-90"
      >
        <PhoneOff size={18} />
      </button>
    </div>
  );
}

function IconButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(iconBtn(), active && 'bg-primary text-primary-foreground')}
    >
      {children}
    </button>
  );
}

function iconBtn() {
  return cn(
    'flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background',
    'text-headline hover:bg-muted transition-colors',
  );
}
