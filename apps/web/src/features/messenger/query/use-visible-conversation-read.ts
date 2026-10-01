'use client';

import { useEffect, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { messengerCoreApi, type MessengerCoreMessageRow } from '@/lib/api/messenger-core';
import { messengerClientApi } from '@/lib/api/messenger-core-client';
import { patchConversationUnread } from './messenger-cache';
import type { MessengerZone } from './messenger-query-keys';
import {
  latestCanonicalMessageId,
  MESSENGER_VISIBLE_READ_COALESCE_MS,
  MessengerVisibleReadCoalescer,
  type VisibleReadGate,
} from './messenger-visible-read';

/**
 * Marks a conversation read only while its thread is mounted and the document is visible.
 * Selecting an id, or subscribing, is not enough. Bursts share one request.
 */
export function useVisibleConversationRead(input: {
  conversationId: string | null;
  threadMounted: boolean;
  latestMessageId: string | null;
  markRead: (conversationId: string) => void;
}): void {
  const [coalescer] = useState(
    () => new MessengerVisibleReadCoalescer(MESSENGER_VISIBLE_READ_COALESCE_MS, () => undefined),
  );
  const conversationId = input.conversationId;
  const threadMounted = input.threadMounted;
  const latestMessageId = input.latestMessageId;
  const markRead = input.markRead;
  useEffect(() => {
    coalescer.setSend(markRead);
  }, [coalescer, markRead]);
  useEffect(() => {
    const publish = () => coalescer.note(currentReadGate(conversationId, threadMounted));
    publish();
    document.addEventListener('visibilitychange', publish);
    return () => {
      document.removeEventListener('visibilitychange', publish);
      coalescer.dispose();
    };
  }, [coalescer, conversationId, latestMessageId, threadMounted]);
}

/** Mounts with an open messenger thread. Does not mark read from selection alone. */
export function VisibleThreadRead(props: {
  zone: MessengerZone;
  conversationId: string | null;
  threadMounted: boolean;
  items: readonly MessengerCoreMessageRow[] | undefined;
}): null {
  const queryClient = useQueryClient();
  useVisibleConversationRead({
    conversationId: props.conversationId,
    threadMounted: props.threadMounted,
    latestMessageId: latestCanonicalMessageId(props.items),
    markRead: (id) => {
      void markVisibleZoneRead(queryClient, props.zone, id);
    },
  });
  return null;
}

async function markVisibleZoneRead(
  queryClient: QueryClient,
  zone: MessengerZone,
  conversationId: string,
): Promise<void> {
  if (zone === 'CLIENT') await messengerClientApi.markRead(conversationId);
  else await messengerCoreApi.markRead(conversationId);
  patchConversationUnread(queryClient, zone, conversationId, 0);
}

function currentReadGate(conversationId: string | null, threadMounted: boolean): VisibleReadGate {
  return {
    conversationId,
    threadMounted,
    documentVisible: document.visibilityState === 'visible',
  };
}
