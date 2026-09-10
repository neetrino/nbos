import type { MessengerInternalSection } from '@/lib/api/messenger-core';
import type {
  MessengerClientListFilter,
  MessengerClientProvider,
  MessengerClientSection,
} from '@/lib/api/messenger-core-client';

export type MessengerZone = 'INTERNAL' | 'CLIENT';

export type InternalSummaryParams =
  | { source: 'all-dataset' }
  | {
      source: 'section';
      section: MessengerInternalSection;
      q: string;
      filter: 'all' | 'unread' | 'mentions';
    };

export type ClientSummaryParams = {
  section: MessengerClientSection;
  q: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
};

export const messengerQueryKeys = {
  root: ['messenger'] as const,
  internalSummariesRoot: ['messenger', 'internal', 'summaries'] as const,
  internalSummaries: (params: InternalSummaryParams) =>
    ['messenger', 'internal', 'summaries', params] as const,
  clientSummariesRoot: ['messenger', 'client', 'summaries'] as const,
  clientSummaries: (params: ClientSummaryParams) =>
    ['messenger', 'client', 'summaries', params] as const,
  collections: (zone: MessengerZone) => ['messenger', 'collections', zone] as const,
  collectionDetail: (zone: MessengerZone, collectionId: string) =>
    ['messenger', 'collections', zone, collectionId] as const,
  messages: (conversationId: string) => ['messenger', 'messages', conversationId] as const,
  internalEntity: (kind: string, entityId: string) =>
    ['messenger', 'internal', 'entity', kind, entityId] as const,
};

export function clientSummariesParams(input: {
  section: MessengerClientSection;
  search: string;
  filter: 'all' | MessengerClientListFilter;
  provider: '' | MessengerClientProvider;
}): ClientSummaryParams {
  return {
    section: input.section,
    q: input.search.trim(),
    filter: input.filter,
    provider: input.provider,
  };
}
