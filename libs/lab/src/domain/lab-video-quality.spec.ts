import { describe, expect, it } from 'vitest';
import {
  ALL_VIDEO_RESOLUTIONS,
  DEFAULT_VIDEO_RESOLUTION_ID,
  isResolutionAllowed,
  LAB_ROOM_OPTIONS,
  MAX_FREE_RESOLUTION_ID,
  PREMIUM_VIDEO_RESOLUTIONS,
  VIDEO_RESOLUTIONS,
  videoPublishOptions,
  videoResolution,
} from './lab-video-quality';

describe('lab video resolutions', () => {
  it('offers the free ladder 144p → 1080p in order', () => {
    expect(VIDEO_RESOLUTIONS.map((r) => r.label)).toEqual([
      '144p',
      '240p',
      '360p',
      '480p',
      '720p',
      '1080p',
    ]);
  });

  it('caps the free tier at 1080p and defaults to 720p', () => {
    expect(MAX_FREE_RESOLUTION_ID).toBe('h1080');
    expect(DEFAULT_VIDEO_RESOLUTION_ID).toBe('h720');
  });

  it('pairs every rung with capture + publish encoding so switching is effective', () => {
    for (const option of VIDEO_RESOLUTIONS) {
      expect(videoResolution(option.id), option.id).toBeDefined();
      const publish = videoPublishOptions(option.id);
      expect(publish?.videoEncoding?.maxBitrate, option.id).toBeGreaterThan(0);
      expect(publish?.simulcast, option.id).toBe(true);
    }
  });

  it('gates anything above 1080p behind the paid plan', () => {
    expect(PREMIUM_VIDEO_RESOLUTIONS.map((r) => r.id)).toEqual(['h1440', 'h2160']);
    for (const premium of PREMIUM_VIDEO_RESOLUTIONS) {
      expect(premium.requiresPlus).toBe(true);
      expect(isResolutionAllowed(premium.id)).toBe(false);
      expect(isResolutionAllowed(premium.id, { hasPlus: true })).toBe(true);
    }
    expect(isResolutionAllowed('h1080')).toBe(true);
    expect(isResolutionAllowed('nope')).toBe(false);
  });

  it('enables adaptive streaming, dynacast and simulcast room-wide', () => {
    expect(LAB_ROOM_OPTIONS.adaptiveStream).toBe(true);
    expect(LAB_ROOM_OPTIONS.dynacast).toBe(true);
    expect(LAB_ROOM_OPTIONS.publishDefaults?.simulcast).toBe(true);
    expect(ALL_VIDEO_RESOLUTIONS.length).toBe(
      VIDEO_RESOLUTIONS.length + PREMIUM_VIDEO_RESOLUTIONS.length,
    );
  });
});
