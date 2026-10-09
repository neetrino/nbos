import type { QueryClient } from '@tanstack/react-query';
import {
  invalidateMessengerCollections,
  patchConversationFavorite,
  upsertConversationSummary,
} from '@/features/messenger/query/messenger-cache';
import { messengerCoreApi, type MessengerCoreConversationRow } from '@/lib/api/messenger-core';

export async function openInternalConversation(
  queryClient: QueryClient,
  conversationId: string,
  setActiveId: (id: string) => void,
  setOpenedConversation?: (row: MessengerCoreConversationRow) => void,
  seed?: MessengerCoreConversationRow,
): Promise<void> {
  setActiveId(conversationId);
  if (seed?.id === conversationId) setOpenedConversation?.(seed);
  const loaded = await messengerCoreApi.getConversation(conversationId);
  const conversation = keepDirectPeer(loaded, seed);
  upsertConversationSummary(queryClient, 'INTERNAL', conversation);
  setOpenedConversation?.(conversation);
}

function keepDirectPeer(
  loaded: MessengerCoreConversationRow,
  seed: MessengerCoreConversationRow | undefined,
): MessengerCoreConversationRow {
  if (!seed || loaded.type !== 'DIRECT') return loaded;
  return {
    ...loaded,
    peerEmployeeId: loaded.peerEmployeeId ?? seed.peerEmployeeId,
    peerName: loaded.peerName ?? seed.peerName,
    peerPosition: loaded.peerPosition ?? seed.peerPosition,
  };
}

/** Opens the existing direct thread or creates one with an employee. */
export async function openDirectWithEmployee(
  queryClient: QueryClient,
  peer: { id: string; name: string },
  setActiveId: (id: string) => void,
  setOpenedConversation?: (row: MessengerCoreConversationRow) => void,
): Promise<void> {
  const created = await messengerCoreApi.createConversation({
    type: 'DIRECT',
    peerEmployeeId: peer.id,
  });
  await openInternalConversation(queryClient, created.id, setActiveId, setOpenedConversation, {
    ...created,
    type: 'DIRECT',
    peerEmployeeId: peer.id,
    peerName: peer.name,
  });
}

export async function toggleInternalFavorite(
  queryClient: QueryClient,
  conversationId: string,
): Promise<void> {
  const result = await messengerCoreApi.toggleFavorite(conversationId);
  patchConversationFavorite(queryClient, 'INTERNAL', conversationId, result.favorite);
  invalidateMessengerCollections(queryClient, 'INTERNAL', result.collectionId);
}
