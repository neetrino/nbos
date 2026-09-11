import { PWA_SERVICE_WORKER_PATH, PWA_SERVICE_WORKER_SCOPE } from './pwa-constants';

export type PwaInstallOffer = 'hidden' | 'prompt' | 'ios-manual';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function isStandaloneDisplay(mediaMatches: boolean, safariStandalone: boolean): boolean {
  return mediaMatches || safariStandalone;
}

export function readSafariStandalone(nav: object): boolean {
  return 'standalone' in nav && (nav as { standalone?: unknown }).standalone === true;
}

export function isIosWebKit(userAgent: string, maxTouchPoints: number): boolean {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return true;
  return /macintosh/.test(ua) && maxTouchPoints > 1;
}

export function resolvePwaInstallOffer(input: {
  standalone: boolean;
  canPrompt: boolean;
  iosWebKit: boolean;
  installedThisSession: boolean;
}): PwaInstallOffer {
  if (input.standalone || input.installedThisSession) return 'hidden';
  if (input.canPrompt) return 'prompt';
  if (input.iosWebKit) return 'ios-manual';
  return 'hidden';
}

export async function registerNbosServiceWorker(
  container: Pick<ServiceWorkerContainer, 'register'> | undefined,
): Promise<boolean> {
  if (!container) return false;
  try {
    await container.register(PWA_SERVICE_WORKER_PATH, {
      scope: PWA_SERVICE_WORKER_SCOPE,
      updateViaCache: 'none',
    });
    return true;
  } catch {
    return false;
  }
}
