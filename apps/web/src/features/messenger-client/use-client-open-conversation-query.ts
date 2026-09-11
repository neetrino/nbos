'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CLIENT_OPEN_CONVERSATION_QUERY } from './client-messenger.constants';

export function useClientOpenConversationQuery(
  openConversation: (id: string) => Promise<void>,
): void {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get(CLIENT_OPEN_CONVERSATION_QUERY)?.trim() || null;
  useEffect(() => {
    if (!requestedId) return;
    void openConversation(requestedId);
  }, [requestedId, openConversation]);
}
