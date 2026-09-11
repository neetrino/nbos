import type { QueryClient } from '@tanstack/react-query';
import { ensureMessengerBootstrap } from '../query/use-messenger-bootstrap';
import {
  hasMessengerDefaultCacheData,
  isMessengerDefaultCacheFresh,
} from '../query/seed-messenger-bootstrap';
import type { MessengerZone } from '../query/messenger-query-keys';
import { getMessengerPersistQueryEnabled } from './messenger-persist-ready';

export function messengerZoneFromNavKey(moduleKey: string): MessengerZone | null {
  if (moduleKey === 'messenger') return 'INTERNAL';
  if (moduleKey === 'client-messenger') return 'CLIENT';
  return null;
}

export function prefetchMessengerZoneBootstrap(
  queryClient: QueryClient,
  zone: MessengerZone,
): Promise<void> | undefined {
  if (!getMessengerPersistQueryEnabled()) return undefined;
  if (isMessengerDefaultCacheFresh(queryClient, zone)) return undefined;
  if (hasMessengerDefaultCacheData(queryClient, zone)) return undefined;
  return ensureMessengerBootstrap(queryClient, zone);
}

export function prefetchMessengerBootstrapForNavKey(
  queryClient: QueryClient,
  moduleKey: string,
): Promise<void> | undefined {
  const zone = messengerZoneFromNavKey(moduleKey);
  if (!zone) return undefined;
  return prefetchMessengerZoneBootstrap(queryClient, zone);
}
