import { describe, expect, it } from 'vitest';
import { pwaDashboardBannerBody } from './pwa-dashboard-banner-copy';

describe('pwaDashboardBannerBody', () => {
  it('uses the iOS Share steps on iPhone', () => {
    expect(pwaDashboardBannerBody('ios-manual')).toContain('Share');
  });

  it('uses the native-install copy when Chrome can prompt', () => {
    expect(pwaDashboardBannerBody('prompt')).toContain('home screen');
  });

  it('falls back to the browser-menu hint', () => {
    expect(pwaDashboardBannerBody('browser-manual')).toContain('browser menu');
  });
});
