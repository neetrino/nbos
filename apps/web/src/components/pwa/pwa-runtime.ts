import { PWA_SERVICE_WORKER_PATH, PWA_SERVICE_WORKER_SCOPE } from './pwa-constants';

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
