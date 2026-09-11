'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { usePermission } from '@/lib/permissions/PermissionContext';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import {
  applyMessengerRealtimeMessage,
  invalidateMessengerCollections,
  patchConversationFavorite,
} from '@/features/messenger/query/messenger-cache';
import {
  applyMessengerAccessChanged,
  applyMessengerRealtimeRead,
  applyMessengerRealtimeSummary,
} from '@/features/messenger/query/messenger-realtime-cache';
import { recoverMessengerZone } from '@/features/messenger/query/messenger-delta-recovery';
import { messengerQueryKeys } from '@/features/messenger/query/messenger-query-keys';
import {
  MESSENGER_QUERY_GC_TIME_MS,
  MESSENGER_QUERY_STALE_TIME_MS,
} from '@/features/messenger/query/messenger-query-policy';
import { useMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import { sendInternalThreadMessage } from './send-internal-thread-message';
import type { EntityConversationKind } from './entity-conversation-kind';
import type { InternalSendExtras } from './InternalConversationThread';

export function useEntityConversation(kind: EntityConversationKind, entityId: string) {
  const queryClient = useQueryClient();
  const { me, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const [newMessage, setNewMessage] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const conversation = useEntityEnsureQuery(kind, entityId, Boolean(canView && me));
  const messagesQuery = useMessengerMessages(conversation.data?.id ?? null, {
    enabled: Boolean(canView && conversation.data?.id),
    zone: 'INTERNAL',
  });
  useEntityRealtime(canView, me?.id, conversation.data?.id ?? null, queryClient, () =>
    setNewMessage(''),
  );
  useEffect(() => {
    if (!conversation.data?.id) return;
    void messengerCoreApi.markRead(conversation.data.id);
  }, [conversation.data?.id]);

  return buildEntityConversationState({
    canView,
    meId: me?.id,
    entityId,
    kind,
    conversation,
    messagesQuery,
    newMessage,
    setNewMessage,
    sendBusy,
    setSendBusy,
    queryClient,
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

function useEntityRealtime(
  canView: boolean,
  meId: string | undefined,
  conversationId: string | null,
  queryClient: QueryClient,
  clearComposer: () => void,
): void {
  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId,
    conversationId,
    onInboundMessage: (_id, message) => {
      applyMessengerRealtimeMessage(queryClient, message);
    },
    onConversationSummary: (payload) => {
      applyMessengerRealtimeSummary(queryClient, 'INTERNAL', payload);
    },
    onConversationRead: (payload) => {
      applyMessengerRealtimeRead(queryClient, 'INTERNAL', payload);
    },
    onAccessChanged: (payload) => {
      applyMessengerAccessChanged(queryClient, 'INTERNAL', payload.conversationId, payload.zone, {
        activeId: conversationId,
        clearActive: clearComposer,
      });
    },
    onReconnect: () => {
      void recoverMessengerZone(queryClient, 'INTERNAL', {
        activeId: conversationId,
        clearActive: clearComposer,
      });
    },
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
  sendBusy: boolean;
  setSendBusy: (busy: boolean) => void;
  queryClient: QueryClient;
}) {
  const row = input.conversation.data ?? null;
  return {
    canView: input.canView,
    conversation: row,
    messages: input.messagesQuery.data?.items ?? [],
    newMessage: input.newMessage,
    setNewMessage: input.setNewMessage,
    loading: Boolean(
      input.canView &&
      input.meId &&
      input.entityId &&
      input.conversation.isPending &&
      input.conversation.data === undefined,
    ),
    sendBusy: input.sendBusy,
    messagesLoading: input.messagesQuery.isPending && input.messagesQuery.data === undefined,
    error:
      input.conversation.error || input.messagesQuery.error
        ? 'Could not open this Internal conversation.'
        : null,
    send: (extras: InternalSendExtras) =>
      void sendInternalThreadMessage({
        conversationId: row?.id ?? null,
        canWrite: Boolean(row?.canWrite),
        sendBusy: input.sendBusy,
        content: input.newMessage,
        extras,
        setSendBusy: input.setSendBusy,
        setNewMessage: input.setNewMessage,
        queryClient: input.queryClient,
      }),
    toggleFavorite: () =>
      void toggleEntityFavorite(input.queryClient, input.kind, input.entityId, row),
  };
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
