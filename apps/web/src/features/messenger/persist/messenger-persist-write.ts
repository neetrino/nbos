import type { QueryClient } from '@tanstack/react-query';
import type { MessengerPersistEnvelope } from './messenger-persist-envelope';
import type { MessengerPersistBackend } from './messenger-persist-idb';
import { isNewerPersistCapture, type MessengerPersistRecencyHeader } from './messenger-persist-recency';
import type { MessengerPersistCapture } from './messenger-persist-snapshot';
import { captureMessengerPersistSnapshot } from './messenger-persist-snapshot';
import {
  isMessengerPersistGenerationCurrent,
  isMessengerPersistIdentity,
  readMessengerPersistChannelIdentity,
  readMessengerPersistLastSeenCapturedAt,
} from './messenger-persist-session';
import { MESSENGER_PERSIST_ENVELOPE_MAX_BYTES } from './messenger-persist.constants';
import { utf8ByteLength } from './messenger-utf8-bytes';

export function shouldReplacePersistedEnvelope(
  existing: MessengerPersistRecencyHeader | null,
  candidate: Pick<MessengerPersistRecencyHeader, 'identityId' | 'capturedAt'>,
): boolean {
  return isNewerPersistCapture(existing, candidate);
}

export async function writeMessengerPersistCapture(
  backend: MessengerPersistBackend,
  queryClient: QueryClient,
  identityId: string,
  generation: number,
  announce: ((envelope: MessengerPersistEnvelope) => void) | null,
): Promise<boolean> {
  if (!isMessengerPersistWriteAllowed(identityId, generation)) return false;
  const capture = captureMessengerPersistSnapshot(queryClient, identityId, Date.now());
  if (!capture) return false;
  return commitMessengerPersistCapture(backend, capture, identityId, generation, announce);
}

export async function commitMessengerPersistCapture(
  backend: MessengerPersistBackend,
  capture: MessengerPersistCapture,
  identityId: string,
  generation: number,
  announce: ((envelope: MessengerPersistEnvelope) => void) | null,
): Promise<boolean> {
  if (!isMessengerPersistWriteAllowed(identityId, generation)) return false;
  if (capture.envelope.identityId !== identityId) return false;
  if (readMessengerPersistLastSeenCapturedAt(identityId) > capture.capturedAt) return false;
  const envelope = serializeCaptureEnvelope(capture);
  if (!envelope) return false;
  if (!isMessengerPersistGenerationCurrent(generation)) return false;
  const wrote = await backend.compareAndWrite({
    identityId,
    serialized: envelope.serialized,
    capturedAt: capture.capturedAt,
    generation,
  });
  if (wrote) announce?.(envelope.value);
  return wrote;
}

function isMessengerPersistWriteAllowed(identityId: string, generation: number): boolean {
  if (!isMessengerPersistGenerationCurrent(generation)) return false;
  if (!isMessengerPersistIdentity(identityId)) return false;
  return readMessengerPersistChannelIdentity() === identityId;
}

function serializeCaptureEnvelope(
  capture: MessengerPersistCapture,
): { value: MessengerPersistEnvelope; serialized: string } | null {
  const writtenAt = Date.now();
  if (writtenAt < capture.capturedAt) return null;
  const value: MessengerPersistEnvelope = {
    ...capture.envelope,
    capturedAt: capture.capturedAt,
    writtenAt,
  };
  const serialized = JSON.stringify(value);
  if (utf8ByteLength(serialized) > MESSENGER_PERSIST_ENVELOPE_MAX_BYTES) return null;
  return { value, serialized };
}
