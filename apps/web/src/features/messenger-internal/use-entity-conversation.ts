'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import {
  invalidateMessengerCollections,
  patchConversationFavorite,
  patchConversationUnread,
  syncConversationListReceipt,
} from '@/features/messenger/query/messenger-cache';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { useMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import { latestCanonicalMessageId } from '@/features/messenger/query/messenger-visible-read';
import { useVisibleConversationRead } from '@/features/messenger/query/use-visible-conversation-read';
import { noteMessengerComposerDraft } from '@/features/messenger/query/messenger-send-claim';
import { messengerComposerSenderName } from '@/features/messenger/query/messenger-local-send';
import { sendInternalThreadMessage } from './send-internal-thread-message';
import type { EntityConversationKind } from './entity-conversation-kind';
import type { InternalSendExtras } from './InternalConversationThread';

export function useEntityConversation(kind: EntityConversationKind, entityId: string) {
  const queryClient = useQueryClient();
  const { me, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const [newMessage, setNewMessage] = useState('');
  const conversation = useEntityEnsureQuery(kind, entityId, Boolean(canView && me));
  const revocation = useEntityAccessRevocation(entityId);
  const loadedId = conversation.data?.id ?? null;
  const revoked = loadedId !== null && loadedId === revocation.revokedId;
  const threadId = revoked ? null : loadedId;
  const messagesQuery = useMessengerMessages(threadId, {
    enabled: Boolean(canView && threadId),
    zone: 'INTERNAL',
  });
  const loadedRef = useRef(loadedId);
  const revokeRef = useRef(revocation.revoke);
  useLayoutEffect(() => {
    loadedRef.current = loadedId;
    revokeRef.current = revocation.revoke;
  });
  const { onlineIds } = useEntityRealtime(canView, me?.id, threadId, () => {
    const id = loadedRef.current;
    if (id) revokeRef.current(id);
    setNewMessage('');
  });
  useEntityVisibleRead(queryClient, canView, loadedId, conversation.error, messagesQuery, revoked);
  useEffect(() => {
    const messages = messagesQuery.data?.items;
    if (!threadId || !me?.id || !messages?.length || revoked) return;
    syncConversationListReceipt(queryClient, 'INTERNAL', {
      conversationId: threadId,
      viewerId: me.id,
      messages,
      peerLastReadAt: messagesQuery.data?.meta.peerLastReadAt ?? null,
    });
  }, [
    me?.id,
    messagesQuery.data?.items,
    messagesQuery.data?.meta.peerLastReadAt,
    queryClient,
    revoked,
    threadId,
  ]);

  return buildEntityConversationState({
    canView,
    meId: me?.id,
    entityId,
    kind,
    conversation,
    messagesQuery,
    newMessage,
    setNewMessage: (value: string) => {
      noteMessengerComposerDraft(conversation.data?.id ?? null, value);
      setNewMessage(value);
    },
    senderId: me?.id ?? null,
    senderName: messengerComposerSenderName(me),
    queryClient,
    revoked,
    onlineIds,
  });
}

function useEntityEnsureQuery(kind: EntityConversationKind, entityId: string, enabled: boolean) {
  return useQuery({
    queryKey: messengerQueryKeys.internalEntity(kind, entityId),
    queryFn: () => ensureEntityConversation(kind, entityId),
    enabled: enabled && Boolean(entityId),
    staleTime: MESSENGER_QUERY_STALE_TIME_MS,
    gcTime: MESSENGER_QUERY_GC_TIME_MS,
  });
}

function useEntityVisibleRead(
  queryClient: QueryClient,
  canView: boolean,
  loadedId: string | null,
  conversationError: unknown,
  messagesQuery: ReturnType<typeof useMessengerMessages>,
  revoked: boolean,
): void {
  useVisibleConversationRead({
    conversationId: loadedId,
    threadMounted: entityThreadMounted(
      canView,
      loadedId,
      conversationError,
      messagesQuery.error,
      revoked,
    ),
    latestMessageId: latestCanonicalMessageId(messagesQuery.data?.items),
    markRead: (id) => {
      void markVisibleEntityRead(queryClient, id);
    },
  });
}

function useEntityRealtime(
  canView: boolean,
  meId: string | undefined,
  conversationId: string | null,
  clearComposer: () => void,
): { onlineIds: ReadonlySet<string> } {
  return useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId,
    zone: 'INTERNAL',
    conversationId,
    clearActive: clearComposer,
  });
}

function buildEntityConversationState(input: {
  canView: boolean;
  meId: string | undefined;
  entityId: string;
  kind: EntityConversationKind;
  conversation: ReturnType<typeof useEntityEnsureQuery>;
  messagesQuery: ReturnType<typeof useMessengerMessages>;
  newMessage: string;
  setNewMessage: (value: string) => void;
  senderId: string | null;
  senderName: string;
  queryClient: QueryClient;
  revoked: boolean;
  onlineIds: ReadonlySet<string>;
}) {
  const row = input.conversation.data ?? null;
  return {
    canView: input.canView,
    conversation: row,
    messages: input.revoked ? [] : (input.messagesQuery.data?.items ?? []),
    peerLastReadAt: input.messagesQuery.data?.meta.peerLastReadAt ?? null,
    newMessage: input.newMessage,
    setNewMessage: input.setNewMessage,
    loading: Boolean(
      input.canView &&
      input.meId &&
      input.entityId &&
      input.conversation.isPending &&
      input.conversation.data === undefined,
    ),
    messagesLoading: input.messagesQuery.isPending && input.messagesQuery.data === undefined,
    error:
      input.conversation.error || input.messagesQuery.error
        ? 'Could not open this Internal conversation.'
        : null,
    revoked: input.revoked,
    send: (extras: InternalSendExtras) =>
      void sendInternalThreadMessage({
        conversationId: input.revoked ? null : (row?.id ?? null),
        canWrite: Boolean(row?.canWrite) && !input.revoked,
        content: input.newMessage,
        extras,
        setNewMessage: input.setNewMessage,
        queryClient: input.queryClient,
        senderId: input.senderId,
        senderName: input.senderName,
      }),
    toggleFavorite: () =>
      void toggleEntityFavorite(input.queryClient, input.kind, input.entityId, row),
    onlineIds: input.onlineIds,
  };
}

function useEntityAccessRevocation(entityId: string): {
  revokedId: string | null;
  revoke: (conversationId: string) => void;
} {
  const [state, setState] = useState<{ entityId: string; revokedId: string | null }>({
    entityId,
    revokedId: null,
  });
  if (state.entityId !== entityId) setState({ entityId, revokedId: null });
  const revokedId = state.entityId === entityId ? state.revokedId : null;
  const revoke = useCallback(
    (conversationId: string) => setState({ entityId, revokedId: conversationId }),
    [entityId],
  );
  return { revokedId, revoke };
}

function entityThreadMounted(
  canView: boolean,
  loadedId: string | null,
  conversationError: unknown,
  messagesError: unknown,
  revoked: boolean,
): boolean {
  return Boolean(canView && loadedId && !conversationError && !messagesError && !revoked);
}

async function markVisibleEntityRead(
  queryClient: QueryClient,
  conversationId: string,
): Promise<void> {
  await messengerCoreApi.markRead(conversationId);
  patchConversationUnread(queryClient, 'INTERNAL', conversationId, 0);
}

async function ensureEntityConversation(
  kind: EntityConversationKind,
  entityId: string,
): Promise<MessengerCoreConversationRow> {
  if (kind === 'product') return messengerCoreApi.ensureProduct(entityId);
  if (kind === 'workspace') return messengerCoreApi.ensureWorkSpace(entityId);
  if (kind === 'deal') return messengerCoreApi.ensureDeal(entityId);
  return messengerCoreApi.ensureProjectGeneral(entityId);
}

async function toggleEntityFavorite(
  queryClient: QueryClient,
  kind: EntityConversationKind,
  entityId: string,
  conversation: MessengerCoreConversationRow | null,
): Promise<void> {
  if (!conversation) return;
  const result = await messengerCoreApi.toggleFavorite(conversation.id);
  patchConversationFavorite(queryClient, 'INTERNAL', conversation.id, result.favorite);
  invalidateMessengerCollections(queryClient, 'INTERNAL', result.collectionId);
  queryClient.setQueryData<MessengerCoreConversationRow>(
    messengerQueryKeys.internalEntity(kind, entityId),
    (current) => (current ? { ...current, isFavorite: result.favorite } : current),
  );
}
