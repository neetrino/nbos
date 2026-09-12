'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { createPersistedScalarStore } from '@/lib/persisted-client-state';
import {
  PWA_BANNER_ACTIVE_VALUE,
  PWA_BANNER_DISMISS_STORAGE_KEY,
  PWA_BANNER_DISMISSED_VALUE,
} from './pwa-constants';
import {
  getInstalledThisSessionServerSnapshot,
  getInstalledThisSessionSnapshot,
  getInstallPromptServerSnapshot,
  getInstallPromptSnapshot,
  getIosWebKitServerSnapshot,
  getIosWebKitSnapshot,
  getStandaloneDisplayServerSnapshot,
  getStandaloneDisplaySnapshot,
  promptDeferredInstall,
  subscribeInstalledThisSession,
  subscribeInstallPrompt,
  subscribeIosWebKit,
  subscribeStandaloneDisplay,
} from './pwa-install-store';
import {
  isPwaBannerDismissed,
  resolvePwaDashboardBannerOffer,
  type PwaDashboardBannerOffer,
} from './pwa-runtime';

const pwaBannerDismissStore = createPersistedScalarStore({
  storageKey: PWA_BANNER_DISMISS_STORAGE_KEY,
  defaultValue: PWA_BANNER_ACTIVE_VALUE,
  parse: (raw) =>
    isPwaBannerDismissed(raw) ? PWA_BANNER_DISMISSED_VALUE : PWA_BANNER_ACTIVE_VALUE,
});

export function usePwaDashboardBanner(): {
  offer: PwaDashboardBannerOffer;
  promptInstall: () => Promise<void>;
  dismiss: () => void;
} {
  const standalone = useSyncExternalStore(
    subscribeStandaloneDisplay,
    getStandaloneDisplaySnapshot,
    getStandaloneDisplayServerSnapshot,
  );
  const iosWebKit = useSyncExternalStore(
    subscribeIosWebKit,
    getIosWebKitSnapshot,
    getIosWebKitServerSnapshot,
  );
  const promptEvent = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptSnapshot,
    getInstallPromptServerSnapshot,
  );
  const installedThisSession = useSyncExternalStore(
    subscribeInstalledThisSession,
    getInstalledThisSessionSnapshot,
    getInstalledThisSessionServerSnapshot,
  );
  const [dismissedFlag, setDismissedFlag] = pwaBannerDismissStore.useValue();

  const promptInstall = useCallback(async () => {
    await promptDeferredInstall();
  }, []);

  const dismiss = useCallback(() => {
    setDismissedFlag(PWA_BANNER_DISMISSED_VALUE);
  }, [setDismissedFlag]);

  return {
    offer: resolvePwaDashboardBannerOffer({
      standalone,
      canPrompt: promptEvent !== null,
      iosWebKit,
      installedThisSession,
      dismissed: dismissedFlag === PWA_BANNER_DISMISSED_VALUE,
    }),
    promptInstall,
    dismiss,
  };
}
