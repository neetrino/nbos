import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSIST_IDENTITY_PATTERN,
} from './messenger-persist.constants';
import { isPlainRecord } from './messenger-persist-plain';

export type MessengerPersistRecencyHeader = {
  identityId: string;
  schemaVersion: number;
  capturedAt: number;
};

export function parseMinimalPersistHeader(raw: string | null): MessengerPersistRecencyHeader | null {
  if (raw == null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isPlainRecord(value)) return null;
    if (typeof value.identityId !== 'string') return null;
    if (!MESSENGER_PERSIST_IDENTITY_PATTERN.test(value.identityId)) return null;
    if (value.schemaVersion !== MESSENGER_CACHE_SCHEMA_VERSION) return null;
    const capturedAt = value.capturedAt;
    if (typeof capturedAt !== 'number' || !Number.isSafeInteger(capturedAt) || capturedAt <= 0) {
      return null;
    }
    return {
      identityId: value.identityId,
      schemaVersion: MESSENGER_CACHE_SCHEMA_VERSION,
      capturedAt,
    };
  } catch {
    return null;
  }
}

/** Candidate wins only when newer. Equal capturedAt is first-write-wins. */
export function isNewerPersistCapture(
  existing: MessengerPersistRecencyHeader | null,
  candidate: Pick<MessengerPersistRecencyHeader, 'identityId' | 'capturedAt'>,
): boolean {
  if (!existing) return true;
  if (existing.identityId !== candidate.identityId) return true;
  return candidate.capturedAt > existing.capturedAt;
}
