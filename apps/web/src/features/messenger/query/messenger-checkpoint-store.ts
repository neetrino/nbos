import type { QueryClient } from '@tanstack/react-query';
import type { MessengerZone } from './messenger-query-keys';

export type MessengerHttpCheckpoint = {
  checkpoint: string;
  authorizationEpoch: string;
};

const CHECKPOINT_PATTERN = /^(0|[1-9]\d{0,19})$/;
const EPOCH_PATTERN = /^[a-f0-9]{32}$/;

const checkpoints = new WeakMap<QueryClient, Partial<Record<MessengerZone, MessengerHttpCheckpoint>>>();

export function parseMessengerHttpCheckpoint(payload: {
  checkpoint?: unknown;
  authorizationEpoch?: unknown;
}): MessengerHttpCheckpoint | null {
  if (typeof payload.checkpoint !== 'string' || !CHECKPOINT_PATTERN.test(payload.checkpoint)) {
    return null;
  }
  if (typeof payload.authorizationEpoch !== 'string' || !EPOCH_PATTERN.test(payload.authorizationEpoch)) {
    return null;
  }
  return { checkpoint: payload.checkpoint, authorizationEpoch: payload.authorizationEpoch };
}

export function readMessengerHttpCheckpoint(
  queryClient: QueryClient,
  zone: MessengerZone,
): MessengerHttpCheckpoint | null {
  return checkpoints.get(queryClient)?.[zone] ?? null;
}

export function writeMessengerHttpCheckpoint(
  queryClient: QueryClient,
  zone: MessengerZone,
  value: MessengerHttpCheckpoint,
): void {
  const current = checkpoints.get(queryClient) ?? {};
  current[zone] = value;
  checkpoints.set(queryClient, current);
}

export function clearMessengerHttpCheckpoint(queryClient: QueryClient, zone: MessengerZone): void {
  const current = checkpoints.get(queryClient);
  if (!current || !current[zone]) return;
  delete current[zone];
}

export function clearAllMessengerHttpCheckpoints(queryClient: QueryClient): void {
  checkpoints.delete(queryClient);
}

export function restoreMessengerHttpCheckpoint(
  queryClient: QueryClient,
  zone: MessengerZone,
  value: MessengerHttpCheckpoint,
): boolean {
  if (readMessengerHttpCheckpoint(queryClient, zone)) return false;
  writeMessengerHttpCheckpoint(queryClient, zone, value);
  return true;
}
