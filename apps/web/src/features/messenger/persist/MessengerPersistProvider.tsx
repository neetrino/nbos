'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { shouldWithholdMessengerPersistChildren } from './messenger-persist-boundary';
import {
  readMessengerPersistReadyState,
  subscribeMessengerPersistReady,
} from './messenger-persist-ready';
import { useMessengerPersistence } from './use-messenger-persistence';

export function MessengerPersistProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, status } = useSession();
  const authenticatedId =
    status === 'authenticated' && typeof data?.user?.id === 'string' ? data.user.id : null;
  const ready = useSyncExternalStore(
    subscribeMessengerPersistReady,
    readMessengerPersistReadyState,
    readMessengerPersistReadyState,
  );
  const liveIdentity = status === 'loading' ? ready.sessionIdentityId : authenticatedId;
  useMessengerPersistence(queryClient, liveIdentity, status);
  if (
    shouldWithholdMessengerPersistChildren({
      status,
      liveIdentity,
      preparedIdentityId: ready.preparedIdentityId,
    })
  ) {
    return null;
  }
  return children;
}
