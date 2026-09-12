import type { PwaDashboardBannerOffer } from './pwa-runtime';

export const PWA_DASHBOARD_BANNER_BODY_KEYS = {
  'ios-manual': 'pwa.bannerIosBody',
  prompt: 'pwa.bannerPromptBody',
  'browser-manual': 'pwa.bannerBrowserBody',
} as const;

export function pwaDashboardBannerBodyKey(
  offer: Exclude<PwaDashboardBannerOffer, 'hidden'>,
): (typeof PWA_DASHBOARD_BANNER_BODY_KEYS)[typeof offer] {
  return PWA_DASHBOARD_BANNER_BODY_KEYS[offer];
}
