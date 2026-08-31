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

export function taskLegacyIdentity(taskId: string): MessengerLegacyIdentityKey {
  return { sourceKind: 'TASK', sourceId: taskId };
}

export function taskDiscussionEntryLegacyIdentity(entryId: string): MessengerLegacyIdentityKey {
  return { sourceKind: 'TASK_DISCUSSION_ENTRY', sourceId: entryId };
}
