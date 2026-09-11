'use client';

import { useCallback, useSyncExternalStore } from 'react';
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
import { resolvePwaInstallOffer, type PwaInstallOffer } from './pwa-runtime';

export function usePwaInstall(): {
  offer: PwaInstallOffer;
  promptInstall: () => Promise<void>;
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

  const promptInstall = useCallback(async () => {
    await promptDeferredInstall();
  }, []);

  return {
    offer: resolvePwaInstallOffer({
      standalone,
      canPrompt: promptEvent !== null,
      iosWebKit,
      installedThisSession,
    }),
    promptInstall,
  };
}
