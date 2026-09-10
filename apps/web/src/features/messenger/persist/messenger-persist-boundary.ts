import type { QueryClient } from '@tanstack/react-query';
import { clearAllMessengerHttpCheckpoints } from '../query/messenger-checkpoint-store';
import { messengerQueryKeys } from '../query/messenger-query-keys';
import { deleteMessengerPersistRecord } from './messenger-persist-controller';
import { isMessengerPersistenceEnabled } from './messenger-persist.constants';
import { readMessengerPersistReadyState } from './messenger-persist-ready';
import {
  installMessengerPersistSessionGate,
  isMessengerPersistIdentity,
  purgeMessengerPersistForSignOut,
  revokeMessengerPersistGeneration,
} from './messenger-persist-session';

export function shouldWithholdMessengerPersistChildren(input: {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  liveIdentity: string | null;
  preparedIdentityId: string | null;
}): boolean {
  if (input.status === 'unauthenticated' && input.preparedIdentityId !== null) return true;
  if (
    input.liveIdentity !== null &&
    input.preparedIdentityId !== null &&
    input.liveIdentity !== input.preparedIdentityId
  ) {
    return true;
  }
  return false;
}

export function applyMessengerPersistSessionIdentity(
  queryClient: QueryClient,
  nextIdentity: string | null,
): void {
  const ready = readMessengerPersistReadyState();
  if (ready.sessionIdentityId === nextIdentity && ready.preparedIdentityId === nextIdentity) {
    return;
  }
  if (nextIdentity === null) {
    purgeMessengerPersistForSignOut();
    return;
  }
  const previousId = ready.preparedIdentityId;
  const persistable =
    isMessengerPersistenceEnabled() && isMessengerPersistIdentity(nextIdentity);
  revokeMessengerPersistGeneration();
  if (previousId && previousId !== nextIdentity) {
    evictMessengerIdentityMemory(queryClient, previousId);
  }
  installMessengerPersistSessionGate(queryClient, nextIdentity, {
    persistable,
    settled: !persistable,
  });
}

export function evictMessengerIdentityMemory(queryClient: QueryClient, previousId: string): void {
  queryClient.removeQueries({ queryKey: messengerQueryKeys.root });
  clearAllMessengerHttpCheckpoints(queryClient);
  if (isMessengerPersistIdentity(previousId)) void deleteMessengerPersistRecord(previousId);
}
