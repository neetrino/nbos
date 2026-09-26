import { afterEach, describe, expect, it } from 'vitest';
import { isVideoMeetingsWebFeatureEnabled } from './feature-flag';

describe('isVideoMeetingsWebFeatureEnabled', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED;
  });

  it('defaults to off when env is unset', () => {
    expect(isVideoMeetingsWebFeatureEnabled()).toBe(false);
  });

  it('enables only for explicit truthy values', () => {
    process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED = 'true';
    expect(isVideoMeetingsWebFeatureEnabled()).toBe(true);
  });
});
