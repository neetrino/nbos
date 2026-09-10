import { isMessengerPersistenceEnabled } from './messenger-persist.constants';

export type MessengerPersistReadyState = {
  hostRegistered: boolean;
  settled: boolean;
  preparedIdentityId: string | null;
  sessionIdentityId: string | null;
};

const listeners = new Set<() => void>();

const EMPTY_READY: MessengerPersistReadyState = {
  hostRegistered: false,
  settled: false,
  preparedIdentityId: null,
  sessionIdentityId: null,
};

let state: MessengerPersistReadyState = EMPTY_READY;

export function subscribeMessengerPersistReady(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readMessengerPersistReadyState(): MessengerPersistReadyState {
  return state;
}

export function getMessengerPersistQueryEnabled(): boolean {
  if (!isMessengerPersistenceEnabled()) return true;
  return (
    state.hostRegistered &&
    state.settled &&
    state.preparedIdentityId !== null &&
    state.preparedIdentityId === state.sessionIdentityId
  );
}

export function getMessengerPersistQueryEnabledServerSnapshot(): boolean {
  return !isMessengerPersistenceEnabled();
}

export function isMessengerPersistHydrating(): boolean {
  return isMessengerPersistenceEnabled() && !getMessengerPersistQueryEnabled();
}

export function registerMessengerPersistHost(): void {
  if (state.hostRegistered) return;
  writeReadyState({ ...state, hostRegistered: true, settled: false });
}

export function unregisterMessengerPersistHost(): void {
  writeReadyState({ ...EMPTY_READY });
}

export function writeMessengerPersistReadyIdentities(input: {
  preparedIdentityId: string | null;
  sessionIdentityId: string | null;
  settled: boolean;
}): void {
  writeReadyState({
    hostRegistered: state.hostRegistered || input.preparedIdentityId !== null,
    preparedIdentityId: input.preparedIdentityId,
    sessionIdentityId: input.sessionIdentityId,
    settled: input.settled && input.preparedIdentityId !== null,
  });
}

export function markMessengerPersistReadySettled(): void {
  if (!state.hostRegistered || state.preparedIdentityId === null) return;
  writeReadyState({ ...state, settled: true });
}

export function markMessengerPersistReadyBlocked(): void {
  if (!state.hostRegistered && !state.settled) return;
  writeReadyState({ ...state, settled: false });
}

export function resetMessengerPersistReadyForTests(): void {
  writeReadyState({ ...EMPTY_READY });
}

export function settleMessengerPersistReadyForTests(identityId = 'employee-user-aaaa'): void {
  writeReadyState({
    hostRegistered: true,
    settled: true,
    preparedIdentityId: identityId,
    sessionIdentityId: identityId,
  });
}

function writeReadyState(next: MessengerPersistReadyState): void {
  if (
    state.hostRegistered === next.hostRegistered &&
    state.settled === next.settled &&
    state.preparedIdentityId === next.preparedIdentityId &&
    state.sessionIdentityId === next.sessionIdentityId
  ) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener());
}
