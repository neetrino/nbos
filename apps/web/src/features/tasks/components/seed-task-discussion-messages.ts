import type { QueryClient } from '@tanstack/react-query';
import { mergeCoreRealtimeMessage } from '@/features/messenger/merge-core-realtime-message';
import type { MessengerMessagesPage } from '@/features/messenger/query/messenger-cache';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import type { TaskDiscussionList } from '@/lib/api/tasks';
import { discussionEntryToCoreMessage } from './discussion-entry-to-core-message';

export function taskDiscussionHasMoreOlder(meta: TaskDiscussionList['meta']): boolean {
  return meta.page > 1 || meta.totalPages > 1 || meta.total > meta.pageSize;
}

export function seedTaskDiscussionMessages(
  queryClient: QueryClient,
  page: TaskDiscussionList,
): void {
  if (!page.conversationId) return;
  const conversationId = page.conversationId;
  const mapped = page.items.map((entry) => discussionEntryToCoreMessage(conversationId, entry));
  const key = messengerQueryKeys.messages(conversationId);
  queryClient.setQueryData<MessengerMessagesPage>(key, (current) => {
    const hasMoreOlder =
      Boolean(current?.meta.hasMoreOlder) || taskDiscussionHasMoreOlder(page.meta);
    if (current) {
      return {
        items: mapped.reduce(
          (items, message) => mergeCoreRealtimeMessage(items, message),
          current.items,
        ),
        meta: { hasMoreOlder },
      };
    }
    return { items: mapped, meta: { hasMoreOlder } };
  });
}
