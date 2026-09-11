'use client';

import { useSyncExternalStore } from 'react';
import {
  getMessengerPersistQueryEnabled,
  getMessengerPersistQueryEnabledServerSnapshot,
  subscribeMessengerPersistReady,
} from './messenger-persist-ready';

export function useMessengerPersistQueriesEnabled(): boolean {
  return useSyncExternalStore(
    subscribeMessengerPersistReady,
    getMessengerPersistQueryEnabled,
    getMessengerPersistQueryEnabledServerSnapshot,
  );
}
