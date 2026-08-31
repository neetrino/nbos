'use client';

import { useEffect, useState } from 'react';
import { usePermission } from '@/lib/permissions/PermissionContext';
import {
  messengerCoreApi,
  type MessengerCoreConversationRow,
  type MessengerCoreMessageRow,
} from '@/lib/api/messenger-core';
import { useInternalMessengerRealtime } from '@/features/messenger-internal/useInternalMessengerRealtime';
import type { EntityConversationKind } from './entity-conversation-kind';

export function useEntityConversation(kind: EntityConversationKind, entityId: string) {
  const { me, can } = usePermission();
  const canView = can('VIEW', 'MESSENGER');
  const bootKey = `${kind}:${entityId}`;
  const [conversation, setConversation] = useState<MessengerCoreConversationRow | null>(null);
  const [messages, setMessages] = useState<MessengerCoreMessageRow[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loading = Boolean(canView && me && entityId && loadedKey !== bootKey);

  useEntityConversationBoot(
    canView,
    me,
    kind,
    entityId,
    bootKey,
    setConversation,
    setMessages,
    setError,
    setLoadedKey,
  );

  useInternalMessengerRealtime({
    canViewMessenger: canView,
    meId: me?.id,
    conversationId: conversation?.id ?? null,
    onInboundMessage: (conversationId, message) => {
      if (conversationId !== conversation?.id) return;
      setMessages((prev) =>
        prev.some((row) => row.id === message.id) ? prev : [...prev, message],
      );
    },
  });

  return {
    canView,
    conversation,
    messages,
    newMessage,
    setNewMessage,
    loading,
    sendBusy,
    error,
    send: () =>
      void sendMessage(conversation, newMessage, sendBusy, setSendBusy, setMessages, setNewMessage),
    toggleFavorite: () => void toggleFavorite(conversation, setConversation),
  };
}

function useEntityConversationBoot(
  canView: boolean,
  me: { id: string } | null | undefined,
  kind: EntityConversationKind,
  entityId: string,
  bootKey: string,
  setConversation: (row: MessengerCoreConversationRow) => void,
  setMessages: (rows: MessengerCoreMessageRow[]) => void,
  setError: (message: string | null) => void,
  setLoadedKey: (key: string) => void,
) {
  useEffect(() => {
    if (!canView || !me || !entityId) return;
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await loadEntityConversation(kind, entityId);
        if (cancelled) return;
        setConversation(loaded.conversation);
        setMessages(loaded.messages);
        setError(null);
        setLoadedKey(bootKey);
      } catch {
        if (cancelled) return;
        setError('Could not open this Internal conversation.');
        setLoadedKey(bootKey);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootKey, canView, entityId, kind, me, setConversation, setError, setLoadedKey, setMessages]);
}

async function loadEntityConversation(
  kind: EntityConversationKind,
  entityId: string,
): Promise<{ conversation: MessengerCoreConversationRow; messages: MessengerCoreMessageRow[] }> {
  const conversation = await ensureEntityConversation(kind, entityId);
  const page = await messengerCoreApi.listMessages(conversation.id);
  await messengerCoreApi.markRead(conversation.id);
  return { conversation, messages: page.items };
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

async function sendMessage(
  conversation: MessengerCoreConversationRow | null,
  newMessage: string,
  sendBusy: boolean,
  setSendBusy: (busy: boolean) => void,
  setMessages: (updater: (prev: MessengerCoreMessageRow[]) => MessengerCoreMessageRow[]) => void,
  setNewMessage: (value: string) => void,
): Promise<void> {
  if (!conversation?.id || !conversation.canWrite || sendBusy) return;
  const content = newMessage.trim();
  if (!content) return;
  setSendBusy(true);
  try {
    const message = await messengerCoreApi.sendMessage(conversation.id, { content });
    setMessages((prev) => (prev.some((row) => row.id === message.id) ? prev : [...prev, message]));
    setNewMessage('');
  } finally {
    setSendBusy(false);
  }
}

async function toggleFavorite(
  conversation: MessengerCoreConversationRow | null,
  setConversation: (
    updater: (current: MessengerCoreConversationRow | null) => MessengerCoreConversationRow | null,
  ) => void,
): Promise<void> {
  if (!conversation) return;
  const result = await messengerCoreApi.toggleFavorite(conversation.id);
  setConversation((current) => (current ? { ...current, isFavorite: result.favorite } : current));
}
