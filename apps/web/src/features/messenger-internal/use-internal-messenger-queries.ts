'use client';

import {
  showMessengerListPlaceholder,
  usesSharedInternalAllDataset,
  type InternalListFilter,
} from '@/features/messenger/query/derive-internal-summaries';
import { useInternalSummaries } from '@/features/messenger/query/use-internal-summaries';
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
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import type { InternalMessengerSectionId } from './internal-messenger.constants';

export function useInternalMessengerQueries(input: {
  section: InternalMessengerSectionId;
  search: string;
  filter: InternalListFilter;
  activeId: string | null;
  activeCollectionId: string | null;
  enabled: boolean;
}) {
  const bootstrap = useMessengerZoneBootstrap('INTERNAL', input.enabled);
  const defaultSummaries = usesSharedInternalAllDataset(input.section, input.search, input.filter);
  const collections = useMessengerCollections(
    'INTERNAL',
    messengerCollectionsEnabled(input.enabled, bootstrap),
  );
  const summaries = useInternalSummaries({
    section: input.section,
    search: input.search,
    filter: input.filter,
    enabled:
      input.section !== 'collections' &&
      messengerDefaultQueriesEnabled(input.enabled, bootstrap, defaultSummaries),
  });
  const collectionDetail = useMessengerCollectionDetail(
    'INTERNAL',
    input.activeCollectionId,
    input.enabled,
  );
  const messages = useMessengerMessages(input.activeId, {
    enabled: input.enabled,
    zone: 'INTERNAL',
  });
  const viewingCollection = input.section === 'collections' && Boolean(input.activeCollectionId);
  const items: MessengerCoreConversationRow[] = viewingCollection
    ? (collectionDetail.data?.conversations ?? [])
    : summaries.items;
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
