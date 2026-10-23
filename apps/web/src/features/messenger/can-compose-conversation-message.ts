import type { MessengerCoreConversationType } from '@/lib/api/messenger-core';

/**
 * Task chat follows Task visibility: anyone who can open the conversation may post.
 * Other Internal chats stay on Messenger `canWrite`.
 */
export function canComposeConversationMessage(conversation: {
  type: MessengerCoreConversationType | string;
  canWrite?: boolean;
}): boolean {
  return conversation.type === 'TASK' || conversation.canWrite === true;
}
