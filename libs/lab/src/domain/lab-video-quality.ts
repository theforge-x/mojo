import {
  type RoomOptions,
  type TrackPublishOptions,
  type VideoCaptureOptions,
  VideoPresets,
} from 'livekit-client';

/** Free tier: 144p → 1080p. Anything above requires a paid plan (see below). */
export type FreeVideoResolutionId = 'h144' | 'h240' | 'h360' | 'h480' | 'h720' | 'h1080';

/**
 * Paid tier placeholders for the future pricing model. Defined here so the
 * cap is a data change (`requiresPlus`) rather than a refactor later — the
 * settings UI already renders them disabled until `hasPlus` is true.
 */
export type PremiumVideoResolutionId = 'h1440' | 'h2160';

export type VideoResolutionId = FreeVideoResolutionId | PremiumVideoResolutionId;

export interface VideoResolutionOption {
  readonly id: VideoResolutionId;
  readonly label: string;
  readonly captureOptions: VideoCaptureOptions;
  readonly publishOptions: TrackPublishOptions;
  /** When true the option is locked unless the user has the paid plan. */
  readonly requiresPlus?: boolean;
}

/**
 * Capture + publish pair per rung. Passing *only* `resolution` changes the
 * camera capture size but leaves the publish bitrate at the SDK default, so
 * low rungs never actually save bandwidth. Each rung now carries its matching
 * `videoEncoding` so a switch re-publishes with the right bitrate/framerate
 * via `setCameraEnabled(true, capture, publish)`.
 */
export const VIDEO_RESOLUTIONS: readonly VideoResolutionOption[] = [
  {
    id: 'h144',
    label: '144p',
    captureOptions: { resolution: { width: 256, height: 144 }, frameRate: 20 },
    publishOptions: {
      videoEncoding: { maxBitrate: 120_000, maxFramerate: 20 },
      simulcast: true,
    },
  },
  {
    id: 'h240',
    label: '240p',
    captureOptions: { resolution: { width: 426, height: 240 }, frameRate: 20 },
    publishOptions: {
      videoEncoding: { maxBitrate: 300_000, maxFramerate: 20 },
      simulcast: true,
    },
  },
  {
    id: 'h360',
    label: '360p',
    captureOptions: {
      resolution: VideoPresets.h360.resolution,
      frameRate: VideoPresets.h360.encoding.maxFramerate,
    },
    publishOptions: {
      videoEncoding: { ...VideoPresets.h360.encoding },
      simulcast: true,
    },
  },
  {
    id: 'h480',
    label: '480p',
    captureOptions: { resolution: { width: 854, height: 480 }, frameRate: 25 },
    publishOptions: {
      videoEncoding: { maxBitrate: 800_000, maxFramerate: 25 },
      simulcast: true,
    },
  },
  {
    id: 'h720',
    label: '720p',
    captureOptions: {
      resolution: VideoPresets.h720.resolution,
      frameRate: VideoPresets.h720.encoding.maxFramerate,
    },
    publishOptions: {
      videoEncoding: { ...VideoPresets.h720.encoding },
      simulcast: true,
    },
  },
  {
    id: 'h1080',
    label: '1080p',
    captureOptions: {
      resolution: VideoPresets.h1080.resolution,
      frameRate: VideoPresets.h1080.encoding.maxFramerate,
    },
    publishOptions: {
      videoEncoding: { ...VideoPresets.h1080.encoding },
      simulcast: true,
    },
  },
];

/** Locked behind the future paid plan — rendered disabled until `hasPlus`. */
export const PREMIUM_VIDEO_RESOLUTIONS: readonly VideoResolutionOption[] = [
  {
    id: 'h1440',
    label: '1440p · Plus',
    captureOptions: {
      resolution: VideoPresets.h1440.resolution,
      frameRate: VideoPresets.h1440.encoding.maxFramerate,
    },
    publishOptions: {
      videoEncoding: { ...VideoPresets.h1440.encoding },
      simulcast: true,
    },
    requiresPlus: true,
  },
  {
    id: 'h2160',
    label: '2160p · Plus',
    captureOptions: {
      resolution: VideoPresets.h2160.resolution,
      frameRate: VideoPresets.h2160.encoding.maxFramerate,
    },
    publishOptions: {
      videoEncoding: { ...VideoPresets.h2160.encoding },
      simulcast: true,
    },
    requiresPlus: true,
  },
];

export const ALL_VIDEO_RESOLUTIONS: readonly VideoResolutionOption[] = [
  ...VIDEO_RESOLUTIONS,
  ...PREMIUM_VIDEO_RESOLUTIONS,
];

/** Free cap — anything above this id requires the paid plan. */
export const MAX_FREE_RESOLUTION_ID: FreeVideoResolutionId = 'h1080';

export const DEFAULT_VIDEO_RESOLUTION_ID: FreeVideoResolutionId = 'h720';

export function findVideoResolution(id: string | undefined): VideoResolutionOption | undefined {
  return ALL_VIDEO_RESOLUTIONS.find((r) => r.id === id);
}

export function videoResolution(id: string | undefined): VideoCaptureOptions | undefined {
  return findVideoResolution(id)?.captureOptions;
}

export function videoPublishOptions(id: string | undefined): TrackPublishOptions | undefined {
  return findVideoResolution(id)?.publishOptions;
}

/** Gate for the future pricing model: >1080p needs `hasPlus`. */
export function isResolutionAllowed(
  id: string | undefined,
  options?: { hasPlus?: boolean },
): boolean {
  const found = findVideoResolution(id);
  if (!found) return false;
  if (found.requiresPlus) return options?.hasPlus === true;
  return true;
}

/**
 * Room-wide defaults that make per-rung switching effective on both ends:
 * - `adaptiveStream` lets LiveKit auto-pick the subscribed layer from the
 *   rendered video size (viewers get the right layer without manual work).
 * - `dynacast` pauses unpublished layers server-side (publisher CPU/bandwidth).
 * - `publishDefaults.simulcast` publishes low/mid layers so remote viewers on
 *   144p–360p actually receive a matching layer instead of a downscaled 720p.
 */
export const LAB_ROOM_OPTIONS: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
    frameRate: VideoPresets.h720.encoding.maxFramerate,
  },
  publishDefaults: {
    simulcast: true,
    videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
  },
};
