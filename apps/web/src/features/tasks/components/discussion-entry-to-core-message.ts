import type { MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import type { TaskDiscussionEntry } from '@/lib/api/tasks';

export function discussionEntryToCoreMessage(
  conversationId: string,
  entry: TaskDiscussionEntry,
): MessengerCoreMessageRow {
  return {
    id: entry.id,
    conversationId,
    senderId: entry.authorActorType === 'USER' ? entry.authorActorId : null,
    senderName: entry.authorDisplayName,
    content: entry.body,
    createdAt: entry.createdAt,
    editedAt: null,
    attachments: [],
  };
}
