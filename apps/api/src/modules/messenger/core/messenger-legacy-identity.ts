import type { MessengerLegacyIdentityKind } from '@nbos/database';

export type MessengerLegacyIdentityKey = {
  sourceKind: MessengerLegacyIdentityKind;
  sourceId: string;
};

export function channelLegacyIdentity(channelId: string): MessengerLegacyIdentityKey {
  return { sourceKind: 'CHANNEL', sourceId: channelId };
}

export function channelMessageLegacyIdentity(messageId: string): MessengerLegacyIdentityKey {
  return { sourceKind: 'CHANNEL_MESSAGE', sourceId: messageId };
}

export function directThreadLegacyIdentity(threadId: string): MessengerLegacyIdentityKey {
  return { sourceKind: 'DIRECT_THREAD', sourceId: threadId };
}

export function directMessageLegacyIdentity(messageId: string): MessengerLegacyIdentityKey {
  return { sourceKind: 'DIRECT_MESSAGE', sourceId: messageId };
}
