import { isValidPersistTimestamp } from './messenger-persist-envelope';
import {
  MESSENGER_CACHE_SCHEMA_VERSION,
  MESSENGER_PERSISTENCE_MAX_AGE_MS,
  MESSENGER_PERSIST_CHANNEL_NAME,
  MESSENGER_PERSIST_IDENTITY_PATTERN,
} from './messenger-persist.constants';
import { isPlainRecord } from './messenger-persist-plain';
import {
  noteMessengerPersistCapturedAt,
  readMessengerPersistChannelIdentity,
} from './messenger-persist-session';

export type MessengerPersistChannelMessage = {
  identityId: string;
  capturedAt: number;
  writtenAt: number;
  schemaVersion: number;
};

type PersistChannel = {
  post(message: MessengerPersistChannelMessage): void;
  close(): void;
};

export function openMessengerPersistChannel(
  activeIdentityId: string,
  onNewerWrite: (message: MessengerPersistChannelMessage) => void,
): PersistChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  const channel = new BroadcastChannel(MESSENGER_PERSIST_CHANNEL_NAME);
  const handleMessage = (event: MessageEvent<unknown>) => {
    const message = ingestChannelMessage(activeIdentityId, event.data, Date.now());
    if (!message) return;
    onNewerWrite(message);
  };
  channel.addEventListener('message', handleMessage);
  return {
    post: (message) => {
      if (!isActivePersistChannelIdentity(activeIdentityId, message.identityId)) return;
      noteMessengerPersistCapturedAt(message.identityId, message.capturedAt);
      channel.postMessage(message);
    },
    close: () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    },
  };
}

export function ingestChannelMessage(
  activeIdentityId: string,
  value: unknown,
  now: number,
): MessengerPersistChannelMessage | null {
  const message = parseChannelMessage(value, now);
  if (!message || !isActivePersistChannelIdentity(activeIdentityId, message.identityId)) {
    return null;
  }
  noteMessengerPersistCapturedAt(message.identityId, message.capturedAt);
  return message;
}

function isActivePersistChannelIdentity(activeIdentityId: string, identityId: string): boolean {
  return identityId === activeIdentityId && readMessengerPersistChannelIdentity() === identityId;
}

export function parseChannelMessage(
  value: unknown,
  now: number,
): MessengerPersistChannelMessage | null {
  if (!isPlainRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== 4) return null;
  if (!keys.includes('identityId') || !keys.includes('capturedAt')) return null;
  if (!keys.includes('writtenAt') || !keys.includes('schemaVersion')) return null;
  if (
    typeof value.identityId !== 'string' ||
    !MESSENGER_PERSIST_IDENTITY_PATTERN.test(value.identityId)
  ) {
    return null;
  }
  if (value.schemaVersion !== MESSENGER_CACHE_SCHEMA_VERSION) return null;
  if (typeof value.capturedAt !== 'number' || !isValidPersistTimestamp(value.capturedAt, now)) {
    return null;
  }
  if (typeof value.writtenAt !== 'number' || !isValidPersistTimestamp(value.writtenAt, now)) {
    return null;
  }
  if (value.writtenAt < value.capturedAt) return null;
  if (now - value.capturedAt > MESSENGER_PERSISTENCE_MAX_AGE_MS) return null;
  return {
    identityId: value.identityId,
    capturedAt: value.capturedAt,
    writtenAt: value.writtenAt,
    schemaVersion: value.schemaVersion,
  };
}
