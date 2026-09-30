import type { QueryClient } from '@tanstack/react-query';
import { messengerCoreApi } from '@/lib/api/messenger-core';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import { openInternalConversation } from './internal-messenger-cache-ops';

export async function createInternalGroupConversation(
  queryClient: QueryClient,
  title: string,
  setActiveId: (id: string) => void,
  setOpenedConversation: (row: MessengerCoreConversationRow) => void,
): Promise<void> {
  const created = await messengerCoreApi.createConversation({
    type: 'INTERNAL_GROUP',
    title,
  });
  await openInternalConversation(queryClient, created.id, setActiveId, setOpenedConversation);
}
