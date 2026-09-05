'use client';

import { useMediaDeviceSelect } from '@livekit/components-react';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mojo/shared/ui';
import { type VideoCaptureOptions, VideoPresets, VideoPresets43 } from 'livekit-client';

export type VideoResolutionId = 'h360' | 'h480' | 'h720' | 'h1080' | 'h1440';

export const VIDEO_RESOLUTIONS: {
  readonly id: VideoResolutionId;
  readonly label: string;
  readonly captureOptions: VideoCaptureOptions;
}[] = [
  { id: 'h360', label: '360p', captureOptions: { resolution: VideoPresets.h360.resolution } },
  { id: 'h480', label: '480p', captureOptions: { resolution: VideoPresets43.h480.resolution } },
  { id: 'h720', label: '720p', captureOptions: { resolution: VideoPresets.h720.resolution } },
  { id: 'h1080', label: '1080p', captureOptions: { resolution: VideoPresets.h1080.resolution } },
  { id: 'h1440', label: '1440p', captureOptions: { resolution: VideoPresets.h1440.resolution } },
];

export const DEFAULT_VIDEO_RESOLUTION_ID: VideoResolutionId = 'h720';

export function videoResolution(id: string | undefined): VideoCaptureOptions | undefined {
  return VIDEO_RESOLUTIONS.find((r) => r.id === id)?.captureOptions;
}

export type VideoAspectId = 'dynamic' | '16-9' | '4-3' | '1-1';

/**
 * How the main video fills the stage. `dynamic` lets it fill whatever space
 * the FocusLayout gives it (LiveKit's default); anything else letterboxes the
 * tile to that fixed ratio inside the stage.
 */
export const VIDEO_ASPECTS: {
  readonly id: VideoAspectId;
  readonly label: string;
  readonly ratio: { width: number; height: number } | null;
}[] = [
  { id: '16-9', label: '16:9', ratio: { width: 16, height: 9 } },
  { id: '4-3', label: '4:3', ratio: { width: 4, height: 3 } },
  { id: '1-1', label: '1:1', ratio: { width: 1, height: 1 } },
  { id: 'dynamic', label: 'Dynamic', ratio: null },
];

export const DEFAULT_VIDEO_ASPECT_ID: VideoAspectId = '16-9';

/** The locked frame for an aspect id, or null for the dynamic/fill behaviour. */
export function videoAspect(id: string | undefined): { width: number; height: number } | null {
  return VIDEO_ASPECTS.find((a) => a.id === id)?.ratio ?? null;
}

export interface LabSettingsPanelProps {
  resolutionId: string;
  onResolutionChange: (id: string) => void;
  aspectRatioId: string;
  onAspectRatioChange: (id: string) => void;
}

/**
 * Adjustable video/audio settings for the live lab: camera and microphone
 * device pickers plus the video capture resolution. Devices are listed from
 * LiveKit's MediaDevices enumeration (so they track hot-plugged devices),
 * and the resolution drives both the next camera publish and a live
 * re-publish while the camera is already on.
 */
export function LabSettingsPanel({
  resolutionId,
  onResolutionChange,
  aspectRatioId,
  onAspectRatioChange,
}: LabSettingsPanelProps) {
  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Video</p>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="video-resolution">
              Resolution
            </Label>
            <Select value={resolutionId} onValueChange={onResolutionChange}>
              <SelectTrigger id="video-resolution" className="w-full" aria-label="Video resolution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_RESOLUTIONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="video-aspect">
              Aspect ratio
            </Label>
            <Select value={aspectRatioId} onValueChange={onAspectRatioChange}>
              <SelectTrigger id="video-aspect" className="w-full" aria-label="Video aspect ratio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_ASPECTS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DeviceSelect kind="videoinput" label="Camera" />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Audio</p>
          <DeviceSelect kind="audioinput" label="Microphone" />
        </div>
      </div>
    </div>
  );
}

function DeviceSelect({ kind, label }: { kind: MediaDeviceKind; label: string }) {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

  const value = devices.some((d) => d.deviceId === activeDeviceId) ? activeDeviceId : undefined;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value}
        onValueChange={(id) => {
          void setActiveMediaDevice(id).catch(() => {});
        }}
        disabled={devices.length === 0}
      >
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue placeholder={devices.length === 0 ? 'None found' : 'Select device'} />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unlabeled device'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
