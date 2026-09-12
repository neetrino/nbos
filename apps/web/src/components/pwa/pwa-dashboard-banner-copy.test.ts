import { describe, expect, it } from 'vitest';
import { pwaDashboardBannerBodyKey } from './pwa-dashboard-banner-copy';

describe('pwaDashboardBannerBodyKey', () => {
  it('uses the iOS Share steps on iPhone', () => {
    expect(pwaDashboardBannerBodyKey('ios-manual')).toBe('pwa.bannerIosBody');
  });

  it('uses the native-install copy when Chrome can prompt', () => {
    expect(pwaDashboardBannerBodyKey('prompt')).toBe('pwa.bannerPromptBody');
  });

  it('falls back to the browser-menu hint', () => {
    expect(pwaDashboardBannerBodyKey('browser-manual')).toBe('pwa.bannerBrowserBody');
  });
});
