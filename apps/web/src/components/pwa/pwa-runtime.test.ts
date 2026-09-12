import { describe, expect, it, vi } from 'vitest';
import {
  isIosWebKit,
  isPwaBannerDismissed,
  isStandaloneDisplay,
  readSafariStandalone,
  registerNbosServiceWorker,
  resolvePwaDashboardBannerOffer,
  resolvePwaInstallOffer,
} from './pwa-runtime';

describe('isStandaloneDisplay', () => {
  it('treats either CSS standalone or iOS standalone as installed', () => {
    expect(isStandaloneDisplay(true, false)).toBe(true);
    expect(isStandaloneDisplay(false, true)).toBe(true);
    expect(isStandaloneDisplay(false, false)).toBe(false);
  });
});

describe('readSafariStandalone', () => {
  it('reads the iOS navigator.standalone flag', () => {
    expect(readSafariStandalone({ standalone: true })).toBe(true);
    expect(readSafariStandalone({})).toBe(false);
  });
});

describe('isIosWebKit', () => {
  it('detects iPhone and iPadOS that reports as Macintosh', () => {
    expect(isIosWebKit('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe(true);
    expect(isIosWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe(true);
    expect(isIosWebKit('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBe(false);
    expect(isIosWebKit('Mozilla/5.0 (Linux; Android 14)', 5)).toBe(false);
  });
});

describe('resolvePwaInstallOffer', () => {
  it('hides the offer when already installed', () => {
    expect(
      resolvePwaInstallOffer({
        standalone: true,
        canPrompt: true,
        iosWebKit: true,
        installedThisSession: false,
      }),
    ).toBe('hidden');
    expect(
      resolvePwaInstallOffer({
        standalone: false,
        canPrompt: true,
        iosWebKit: false,
        installedThisSession: true,
      }),
    ).toBe('hidden');
  });

  it('prefers the native install prompt when the browser offers it', () => {
    expect(
      resolvePwaInstallOffer({
        standalone: false,
        canPrompt: true,
        iosWebKit: false,
        installedThisSession: false,
      }),
    ).toBe('prompt');
  });

  it('falls back to the iOS Share hint', () => {
    expect(
      resolvePwaInstallOffer({
        standalone: false,
        canPrompt: false,
        iosWebKit: true,
        installedThisSession: false,
      }),
    ).toBe('ios-manual');
  });
});

describe('isPwaBannerDismissed', () => {
  it('treats only the stored dismissed flag as dismissed', () => {
    expect(isPwaBannerDismissed('1')).toBe(true);
    expect(isPwaBannerDismissed('0')).toBe(false);
    expect(isPwaBannerDismissed(null)).toBe(false);
  });
});

describe('resolvePwaDashboardBannerOffer', () => {
  const visible = {
    standalone: false,
    canPrompt: false,
    iosWebKit: false,
    installedThisSession: false,
    dismissed: false,
  };

  it('hides after dismiss, install, or standalone', () => {
    expect(resolvePwaDashboardBannerOffer({ ...visible, dismissed: true })).toBe('hidden');
    expect(resolvePwaDashboardBannerOffer({ ...visible, standalone: true })).toBe('hidden');
    expect(resolvePwaDashboardBannerOffer({ ...visible, installedThisSession: true })).toBe(
      'hidden',
    );
  });

  it('prefers the native prompt, then iOS, then a browser-menu hint', () => {
    expect(resolvePwaDashboardBannerOffer({ ...visible, canPrompt: true })).toBe('prompt');
    expect(resolvePwaDashboardBannerOffer({ ...visible, iosWebKit: true })).toBe('ios-manual');
    expect(resolvePwaDashboardBannerOffer(visible)).toBe('browser-manual');
  });
});

describe('registerNbosServiceWorker', () => {
  it('returns false when the browser has no service worker container', async () => {
    await expect(registerNbosServiceWorker(undefined)).resolves.toBe(false);
  });

  it('registers the install-only worker at site root', async () => {
    const register = vi.fn().mockResolvedValue({});
    await expect(registerNbosServiceWorker({ register })).resolves.toBe(true);
    expect(register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
  });
});
