'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { tasksApi, type TaskDiscussionList } from '@/lib/api/tasks';
import { patchConversationUnread } from '@/features/messenger/query/messenger-cache';
import {
  failedLocalSendKey,
  localSendReceiptLabel,
  messengerComposerSenderName,
  TASK_PENDING_CONVERSATION_PREFIX,
  taskPendingConversationId,
} from '@/features/messenger/query/messenger-local-send';
import { latestCanonicalMessageId } from '@/features/messenger/query/messenger-visible-read';
import { useVisibleConversationRead } from '@/features/messenger/query/use-visible-conversation-read';
import { beginOptimisticCoreSend } from '@/features/messenger/query/messenger-optimistic-send';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { noteMessengerComposerDraft } from '@/features/messenger/query/messenger-send-claim';
import { useObservedMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import { discussionEntryToCoreMessage } from './discussion-entry-to-core-message';
import { seedTaskDiscussionMessages } from './seed-task-discussion-messages';
import type { TaskLocalMessage } from './TaskSheetChatPanel';

export function taskDiscussionLocatorKey(taskId: string) {
  return ['tasks', 'discussion', 'locator', taskId] as const;
}

/**
 * Loads one Task discussion into the shared message cache.
 * Retains that conversation on the shared realtime runtime only while `open` is true.
 * Marks it read only while that thread is open, the document is visible, Messenger VIEW is granted, and the id is a server id.
 */
export function useTaskDiscussion(taskId: string | null, open: boolean) {
  const queryClient = useQueryClient();
  const { me } = usePermission();
  const activeId = open ? taskId : null;
  const listQuery = useTaskDiscussionQuery(queryClient, activeId);
  const thread = useOpenTaskThread(open, listQuery.data?.conversationId ?? null);
  const stagedId = taskPendingScope(thread.conversationId, activeId);
  const staged = useObservedMessengerMessages(stagedId);
  useTaskDiscussionError(listQuery.error);
  const send = useTaskDiscussionSend(queryClient, activeId, thread, me);
  const noteDraft = useCallback(
    (value: string) => noteMessengerComposerDraft(thread.conversationId ?? stagedId, value),
    [stagedId, thread.conversationId],
  );
  return {
    messages: visibleTaskMessages(thread, staged.data?.items),
    send,
    noteDraft,
    composerDisabled: thread.revoked,
  };
}

export async function sendTaskDiscussionNote(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string | null,
  conversationId: string | null,
  body: string,
  sender?: { senderId: string | null; senderName: string },
): Promise<void> {
  if (!taskId) return;
  const cacheId = conversationId ?? taskPendingConversationId(taskId);
  const content = body.trim();
  await beginOptimisticCoreSend({
    queryClient,
    zone: 'INTERNAL',
    conversationId: cacheId,
    content,
    senderId: sender?.senderId ?? null,
    senderName: sender?.senderName ?? 'You',
    onComposerClear: () => undefined,
    onFailure: (error) => toast.error(getApiErrorMessage(error, 'Could not post the note.')),
    transport: (idempotencyKey) => postTaskDiscussion(queryClient, taskId, content, idempotencyKey),
  });
}

function useTaskDiscussionSend(
  queryClient: ReturnType<typeof useQueryClient>,
  activeId: string | null,
  thread: { revoked: boolean; conversationId: string | null },
  me: { id: string; firstName?: string | null; lastName?: string | null } | null | undefined,
) {
  return useCallback(
    (body: string) => {
      if (thread.revoked) return;
      return sendTaskDiscussionNote(queryClient, activeId, thread.conversationId, body, {
        senderId: me?.id ?? null,
        senderName: messengerComposerSenderName(me),
      });
    },
    [activeId, me, queryClient, thread.conversationId, thread.revoked],
  );
}

function taskPendingScope(conversationId: string | null, activeId: string | null): string | null {
  if (conversationId || !activeId) return null;
  return taskPendingConversationId(activeId);
}

function visibleTaskMessages(
  thread: { revoked: boolean; conversationId: string | null; messages: TaskLocalMessage[] },
  staged: MessengerCoreMessageRow[] | undefined,
): TaskLocalMessage[] {
  if (thread.revoked) return [];
  if (thread.conversationId) return thread.messages;
  return (staged ?? []).map(coreMessageToLocal);
}

async function postTaskDiscussion(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  content: string,
  idempotencyKey: string,
) {
  const entry = await tasksApi.addDiscussion(taskId, content, idempotencyKey);
  if (!entry.conversationId) {
    throw new Error('Task discussion did not return a conversation');
  }
  rememberTaskConversation(queryClient, taskId, entry.conversationId);
  return {
    message: discussionEntryToCoreMessage(entry.conversationId, entry),
    conversationId: entry.conversationId,
    conversation: entry.conversation,
  };
}

function rememberTaskConversation(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
  threadId: string,
): void {
  queryClient.setQueryData<TaskDiscussionList>(taskDiscussionLocatorKey(taskId), (current) => ({
    items: current?.items ?? [],
    meta: current?.meta ?? { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    conversationId: threadId,
  }));
}

function useTaskDiscussionQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  activeId: string | null,
) {
  return useQuery({
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
}

function useOpenTaskThread(discussionOpen: boolean, loadedConversationId: string | null) {
  const { me, can } = usePermission();
  const canViewMessenger = can('VIEW', 'MESSENGER');
  const sessionKey = taskDiscussionSessionKey(discussionOpen, loadedConversationId);
  const revocation = useTaskRevocation(sessionKey);
  const thread = resolveOpenTaskThread(discussionOpen, loadedConversationId, revocation.revokedId);
  useInternalMessengerRealtime({
    canViewMessenger,
    meId: me?.id,
    zone: 'INTERNAL',
    conversationId: thread.conversationId,
    clearActive: () => {
      if (loadedConversationId) revocation.revoke(loadedConversationId);
    },
  });
  const cached = useObservedMessengerMessages(thread.conversationId);
  useTaskVisibleRead(discussionOpen, canViewMessenger, thread, cached.data?.items);
  return {
    conversationId: thread.conversationId,
    revoked: thread.revoked,
    messages: thread.revoked ? [] : (cached.data?.items ?? []).map(coreMessageToLocal),
  };
}

function useTaskVisibleRead(
  discussionOpen: boolean,
  canViewMessenger: boolean,
  thread: { conversationId: string | null; revoked: boolean },
  items: readonly MessengerCoreMessageRow[] | undefined,
): void {
  const queryClient = useQueryClient();
  const conversationId = openServerConversationId(discussionOpen, thread);
  useVisibleConversationRead({
    conversationId,
    threadMounted: canViewMessenger && Boolean(conversationId),
    latestMessageId: latestCanonicalMessageId(items),
    markRead: (id) => {
      void markVisibleTaskRead(queryClient, id);
    },
  });
}

function openServerConversationId(
  discussionOpen: boolean,
  thread: { conversationId: string | null; revoked: boolean },
): string | null {
  if (!discussionOpen || thread.revoked) return null;
  return readableTaskConversationId(thread.conversationId);
}

function readableTaskConversationId(conversationId: string | null): string | null {
  if (!conversationId || conversationId.startsWith(TASK_PENDING_CONVERSATION_PREFIX)) return null;
  return conversationId;
}

async function markVisibleTaskRead(
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
): Promise<void> {
  await messengerCoreApi.markRead(conversationId);
  patchConversationUnread(queryClient, 'INTERNAL', conversationId, 0);
}

function useTaskRevocation(sessionKey: string): {
  revokedId: string | null;
  revoke: (conversationId: string) => void;
} {
  const [revoked, setRevoked] = useState<{ key: string; id: string | null }>({
    key: sessionKey,
    id: null,
  });
  if (revoked.key !== sessionKey) setRevoked({ key: sessionKey, id: null });
  const revokedId = revoked.key === sessionKey ? revoked.id : null;
  const revoke = useCallback(
    (conversationId: string) => setRevoked({ key: sessionKey, id: conversationId }),
    [sessionKey],
  );
  return { revokedId, revoke };
}

function useTaskDiscussionError(error: unknown): void {
  useEffect(() => {
    if (!error) return;
    toast.error(getApiErrorMessage(error, 'Could not load task discussion.'));
  }, [error]);
}

function taskDiscussionSessionKey(
  discussionOpen: boolean,
  loadedConversationId: string | null,
): string {
  return `${discussionOpen ? 'open' : 'closed'}:${loadedConversationId ?? ''}`;
}

function resolveOpenTaskThread(
  discussionOpen: boolean,
  loadedConversationId: string | null,
  revokedId: string | null,
): { conversationId: string | null; revoked: boolean } {
  const revoked =
    discussionOpen && loadedConversationId !== null && loadedConversationId === revokedId;
  const conversationId =
    discussionOpen && loadedConversationId && !revoked ? loadedConversationId : null;
  return { conversationId, revoked };
}

function coreMessageToLocal(row: MessengerCoreMessageRow): TaskLocalMessage {
  return {
    id: row.id,
    body: row.content,
    createdAt: row.createdAt,
    authorLabel: row.senderName,
    receiptLabel: localSendReceiptLabel(row),
    localSendKey: failedLocalSendKey(row),
  };
}
