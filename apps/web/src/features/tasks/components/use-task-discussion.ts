'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { tasksApi, type TaskDiscussionList } from '@/lib/api/tasks';
import { applyMessengerSendResult } from '@/features/messenger/query/messenger-cache';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { useObservedMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import { discussionEntryToCoreMessage } from './discussion-entry-to-core-message';
import { seedTaskDiscussionMessages } from './seed-task-discussion-messages';
import type { TaskLocalMessage } from './TaskSheetChatPanel';

export function taskDiscussionLocatorKey(taskId: string) {
  return ['tasks', 'discussion', 'locator', taskId] as const;
}

export function useTaskDiscussion(taskId: string | null, open: boolean) {
  const queryClient = useQueryClient();
  const activeId = open ? taskId : null;
  const listQuery = useQuery({
    queryKey: taskDiscussionLocatorKey(activeId ?? ''),
    queryFn: async () => {
      const page = await tasksApi.listDiscussion(activeId as string);
      seedTaskDiscussionMessages(queryClient, page);
      return page;
    },
    enabled: Boolean(activeId),
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
  const conversationId = listQuery.data?.conversationId ?? null;
  const cached = useObservedMessengerMessages(conversationId);

  useEffect(() => {
    if (!listQuery.error) return;
    toast.error(getApiErrorMessage(listQuery.error, 'Could not load task discussion.'));
  }, [listQuery.error]);

  const send = useCallback(
    (body: string) => sendTaskDiscussionNote(queryClient, activeId, conversationId, body),
    [activeId, conversationId, queryClient],
  );

  return {
    messages: (cached.data?.items ?? []).map(coreMessageToLocal),
    send,
  };
}

export async function sendTaskDiscussionNote(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string | null,
  conversationId: string | null,
  body: string,
): Promise<void> {
  if (!taskId) return;
  try {
    const entry = await tasksApi.addDiscussion(taskId, body);
    const threadId = entry.conversationId ?? conversationId;
    if (!threadId) return;
    applyMessengerSendResult(
      queryClient,
      'INTERNAL',
      discussionEntryToCoreMessage(threadId, entry),
      entry.conversation,
    );
    queryClient.setQueryData<TaskDiscussionList>(taskDiscussionLocatorKey(taskId), (current) => ({
      items: current?.items ?? [],
      meta: current?.meta ?? { total: 1, page: 1, pageSize: 20, totalPages: 1 },
      conversationId: threadId,
    }));
  } catch (error: unknown) {
    toast.error(getApiErrorMessage(error, 'Could not post the note.'));
  }
}

function coreMessageToLocal(row: {
  id: string;
  content: string;
  createdAt: string;
  senderName: string;
}): TaskLocalMessage {
  return {
    id: row.id,
    body: row.content,
    createdAt: row.createdAt,
    authorLabel: row.senderName,
  };
}
