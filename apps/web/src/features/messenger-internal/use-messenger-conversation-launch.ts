'use client';

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { openInternalConversation } from './internal-messenger-cache-ops';
import { registerMessengerConversationOpener } from './messenger-conversation-opener';

export function useMessengerConversationLaunch(input: {
  queryClient: QueryClient;
  enabled: boolean;
  launchConversationId: string | null;
  setActiveId: (id: string | null) => void;
  setOpenedConversation: (row: MessengerCoreConversationRow | null) => void;
  setBootError: (message: string | null) => void;
}) {
  const {
    queryClient,
    enabled,
    launchConversationId,
    setActiveId,
    setOpenedConversation,
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
    void openInternalConversation(
      queryClient,
      launchConversationId,
      setActiveId,
      setOpenedConversation,
    ).catch(() => setBootError('Could not open that Internal conversation.'));
  }, [
    enabled,
    launchConversationId,
    queryClient,
    setActiveId,
    setBootError,
    setOpenedConversation,
  ]);
}
