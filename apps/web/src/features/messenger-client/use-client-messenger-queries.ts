'use client';

import { showMessengerListPlaceholder } from '@/features/messenger/query/derive-internal-summaries';
import { useClientSummaries } from '@/features/messenger/query/use-client-summaries';
import {
  messengerCollectionsEnabled,
  messengerDefaultQueriesEnabled,
  useMessengerZoneBootstrap,
} from '@/features/messenger/query/use-messenger-bootstrap';
import {
  useMessengerCollectionDetail,
  useMessengerCollections,
} from '@/features/messenger/query/use-messenger-collections';
import { useMessengerMessages } from '@/features/messenger/query/use-messenger-messages';
import type {
  MessengerClientConversationRow,
  MessengerClientListFilter,
  MessengerClientProvider,
  MessengerClientSection,
} from '@/lib/api/messenger-core-client';

export function useClientMessengerQueries(input: {
  section: MessengerClientSection;
  search: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
  activeId: string | null;
  activeCollectionId: string | null;
  enabled: boolean;
}) {
  const bootstrap = useMessengerZoneBootstrap('CLIENT', input.enabled);
  const defaultSummaries = isDefaultClientInbox(input);
  const collections = useMessengerCollections(
    'CLIENT',
    messengerCollectionsEnabled(input.enabled, bootstrap),
  );
  const summaries = useClientSummaries({
    section: input.section,
    search: input.search,
    filter: input.filter,
    provider: input.provider,
    enabled:
      input.section !== 'collections' &&
      messengerDefaultQueriesEnabled(input.enabled, bootstrap, defaultSummaries),
  });
  const collectionDetail = useMessengerCollectionDetail(
    'CLIENT',
    input.activeCollectionId,
    input.enabled,
  );
  const messages = useMessengerMessages(input.activeId, {
    enabled: input.enabled,
    zone: 'CLIENT',
  });
  const viewingCollection = input.section === 'collections' && Boolean(input.activeCollectionId);
  const items: MessengerClientConversationRow[] = viewingCollection
    ? ((collectionDetail.data?.conversations ?? []) as MessengerClientConversationRow[])
    : (summaries.data?.items ?? []);
  const listPending = viewingCollection
    ? showMessengerListPlaceholder(collectionDetail.data, collectionDetail.isPending)
    : showMessengerListPlaceholder(summaries.data, summaries.isPending || bootstrap.isPending);
  const listError =
    bootstrap.error ||
    collections.error ||
    summaries.error ||
    collectionDetail.error ||
    messages.error;
  return { collections, summaries, collectionDetail, messages, items, listPending, listError };
}

function isDefaultClientInbox(input: {
  section: MessengerClientSection;
  search: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
}): boolean {
  return (
    input.section === 'inbox' &&
    input.search.trim().length === 0 &&
    input.filter === 'all' &&
    input.provider === ''
  );
}
