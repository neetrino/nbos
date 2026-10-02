'use client';

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import { ticketSourceMessageCacheMatches, ticketSourceQueryKey } from './ticket-source-query';

export function useTicketSourceMessages(ticketId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ticketSourceQueryKey(ticketId),
    queryFn: () => messengerCoreApi.listTicketSources(ticketId),
  });
  const conversationIds = useMemo(() => uniqueConversationIds(query.data), [query.data]);
  const conversationKey = conversationIds.join('|');
  useEffect(() => {
    if (!conversationKey) return;
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated') return;
      if (!ticketSourceMessageCacheMatches(event.query.queryKey, conversationIds)) return;
      void queryClient.invalidateQueries({ queryKey: ticketSourceQueryKey(ticketId) });
    });
  }, [conversationIds, conversationKey, queryClient, ticketId]);
  return { query, conversationIds };
}

function uniqueConversationIds(
  rows: Array<{ sourceConversationId: string }> | undefined,
): string[] {
  if (!rows) return [];
  return [...new Set(rows.map((row) => row.sourceConversationId))];
}
