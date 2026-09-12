import {
  PWA_BANNER_BROWSER_BODY,
  PWA_BANNER_IOS_BODY,
  PWA_BANNER_PROMPT_BODY,
} from './pwa-constants';
import type { PwaDashboardBannerOffer } from './pwa-runtime';

export function pwaDashboardBannerBody(offer: Exclude<PwaDashboardBannerOffer, 'hidden'>): string {
  if (offer === 'ios-manual') return PWA_BANNER_IOS_BODY;
  if (offer === 'prompt') return PWA_BANNER_PROMPT_BODY;
  return PWA_BANNER_BROWSER_BODY;
}
