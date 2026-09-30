'use client';

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { InternalListFilter } from '@/features/messenger/query/derive-internal-summaries';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { openInternalConversation } from './internal-messenger-cache-ops';
import { registerMessengerConversationOpener } from './messenger-conversation-opener';

export function useMessengerConversationLaunch(input: {
  queryClient: QueryClient;
  enabled: boolean;
  launchConversationId: string | null;
  launchSerial: number;
  setActiveId: (id: string | null) => void;
  setOpenedConversation: (row: MessengerCoreConversationRow | null) => void;
  setFilter: (value: InternalListFilter) => void;
  setBootError: (message: string | null) => void;
}) {
  const {
    queryClient,
    enabled,
    launchConversationId,
    launchSerial,
    setActiveId,
    setOpenedConversation,
    setFilter,
    setBootError,
  } = input;

  useEffect(() => {
    return registerMessengerConversationOpener((conversationId) => {
      void openInternalConversation(
        queryClient,
        conversationId,
        setActiveId,
        setOpenedConversation,
      ).catch(() => setBootError('Could not open that Internal conversation.'));
    });
  }, [queryClient, setActiveId, setBootError, setOpenedConversation]);

  useEffect(() => {
    if (!launchConversationId || !enabled) return;
    setFilter('all');
    void openInternalConversation(
      queryClient,
      launchConversationId,
      setActiveId,
      setOpenedConversation,
    ).catch(() => setBootError('Could not open that Internal conversation.'));
  }, [
    enabled,
    launchConversationId,
    launchSerial,
    queryClient,
    setActiveId,
    setBootError,
    setFilter,
    setOpenedConversation,
  ]);
}
