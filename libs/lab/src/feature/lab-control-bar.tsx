'use client';

import { TrackToggle, useLocalParticipant } from '@livekit/components-react';
import { Popover, PopoverContent, PopoverTrigger } from '@mojo/shared/ui';
import { cn } from '@mojo/shared/util';
import { Track } from 'livekit-client';
import {
  FileUp,
  Hand,
  MessageSquare,
  Mic,
  MicOff,
  PenTool,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  SlidersHorizontal,
  SmilePlus,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import { useState } from 'react';
import { REACTION_CHOICES, useLabReactions } from './lab-reactions';
import {
  DEFAULT_VIDEO_RESOLUTION_ID,
  isResolutionAllowed,
  LabSettingsPanel,
  videoPublishOptions,
  videoResolution,
} from './lab-settings-panel';

export interface LabControlBarProps {
  participantCount: number;
  chatOpen: boolean;
  whiteboardOpen: boolean;
  filesOpen: boolean;
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onToggleFiles: () => void;
  onLeave: () => void;
  aspectRatioId: string;
  onAspectRatioChange: (id: string) => void;
  /** Paid-plan entitlement — unlocks 1440p+ when the pricing model lands. */
  hasPlus?: boolean;
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
  aspectRatioId,
  onAspectRatioChange,
  hasPlus = false,
}: LabControlBarProps) {
  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant } =
    useLocalParticipant();
  const { sendReaction, ownHandRaised, toggleHandRaised } = useLabReactions();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [videoResolutionId, setVideoResolutionId] = useState<string>(DEFAULT_VIDEO_RESOLUTION_ID);

  const applyResolution = (id: string) => {
    // Free tier caps at 1080p — premium rungs stay locked until hasPlus.
    if (!isResolutionAllowed(id, { hasPlus })) return;
    setVideoResolutionId(id);
    const captureOptions = videoResolution(id);
    const publishOptions = videoPublishOptions(id);
    // Re-publish with the new capture + encoding straight away when the
    // camera is already on; otherwise the next time it's enabled TrackToggle
    // applies them.
    if (captureOptions && isCameraEnabled) {
      void localParticipant?.setCameraEnabled(true, captureOptions, publishOptions).catch(() => {});
    }
  };

  return (
    <>
      {settingsOpen && (
        <LabSettingsPanel
          resolutionId={videoResolutionId}
          onResolutionChange={applyResolution}
          aspectRatioId={aspectRatioId}
          onAspectRatioChange={onAspectRatioChange}
          hasPlus={hasPlus}
        />
      )}

      <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Users size={14} />
          {participantCount}
        </div>

        <div className="flex items-center gap-2">
          <TrackToggle source={Track.Source.Microphone} showIcon={false} className={iconBtn()}>
            {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </TrackToggle>
          <TrackToggle
            source={Track.Source.Camera}
            showIcon={false}
            captureOptions={videoResolution(videoResolutionId)}
            publishOptions={videoPublishOptions(videoResolutionId)}
            className={iconBtn()}
          >
            {isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </TrackToggle>
          <TrackToggle source={Track.Source.ScreenShare} showIcon={false} className={iconBtn()}>
            {isScreenShareEnabled ? <ScreenShareOff size={18} /> : <ScreenShare size={18} />}
          </TrackToggle>

          <div className="mx-1 h-6 w-px bg-border" />

          <Popover>
            <PopoverTrigger asChild>
              <button type="button" aria-label="Send a reaction" className={iconBtn()}>
                <SmilePlus size={18} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" side="top" className="w-auto p-1.5">
              <span className="sr-only">Reactions</span>
              {REACTION_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`Send ${emoji}`}
                  onClick={() => sendReaction(emoji)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <button
            type="button"
            aria-label="Raise hand"
            aria-pressed={ownHandRaised}
            onClick={toggleHandRaised}
            className={cn(iconBtn(), ownHandRaised && 'bg-primary text-primary-foreground')}
          >
            <Hand size={18} />
          </button>

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
          <IconButton
            active={settingsOpen}
            onClick={() => setSettingsOpen((open) => !open)}
            label="Settings"
          >
            <SlidersHorizontal size={18} />
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
    </>
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
    'text-headline hover:bg-muted transition-colors disabled:pointer-events-none',
  );
}
