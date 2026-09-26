import { afterEach, describe, expect, it } from 'vitest';
import { NAV_MODULE_DEFINITIONS } from './nav-config';
import { applyNavFeatureFlags } from './nav-feature-flags';

describe('applyNavFeatureFlags', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED;
  });

  it('hides Video Meetings nav when the public flag is off', () => {
    const visible = applyNavFeatureFlags(NAV_MODULE_DEFINITIONS);
    expect(visible.some((item) => item.key === 'video-meetings')).toBe(false);
  });

  it('keeps Video Meetings nav when the public flag is on', () => {
    process.env.NEXT_PUBLIC_VIDEO_MEETINGS_V1_ENABLED = 'true';
    const visible = applyNavFeatureFlags(NAV_MODULE_DEFINITIONS);
    expect(visible.some((item) => item.key === 'video-meetings')).toBe(true);
  });
});
