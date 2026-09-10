import type { MessengerCoreConversationRow, MessengerInternalSection } from '@/lib/api/messenger-core';
import type { InternalSummaryParams } from './messenger-query-keys';
import { messengerQueryKeys } from './messenger-query-keys';

export type InternalListFilter = 'all' | 'unread' | 'mentions';

export function usesSharedInternalAllDataset(
  section: MessengerInternalSection,
  search: string,
  filter: InternalListFilter,
): boolean {
  if (section !== 'all' && section !== 'tasks') return false;
  if (search.trim().length > 0) return false;
  if (filter === 'mentions' || filter === 'unread') return false;
  return true;
}

export function resolveInternalSummaryParams(
  section: MessengerInternalSection,
  search: string,
  filter: InternalListFilter,
): InternalSummaryParams {
  if (usesSharedInternalAllDataset(section, search, filter)) {
    return { source: 'all-dataset' };
  }
  return {
    source: 'section',
    section,
    q: search.trim(),
    filter,
  };
}

export function internalSummariesQueryKey(
  section: MessengerInternalSection,
  search: string,
  filter: InternalListFilter,
) {
  return messengerQueryKeys.internalSummaries(
    resolveInternalSummaryParams(section, search, filter),
  );
}

export function deriveInternalVisibleSummaries(
  items: MessengerCoreConversationRow[],
  section: MessengerInternalSection,
  filter: InternalListFilter,
): MessengerCoreConversationRow[] {
  const scoped = section === 'tasks' ? items.filter((row) => row.type === 'TASK') : items;
  if (filter === 'unread') return scoped.filter((row) => (row.unreadCount ?? 0) > 0);
  return scoped;
}

export function isInternalAllFamilyParams(params: InternalSummaryParams): boolean {
  if (params.source === 'all-dataset') return true;
  return params.section === 'all' || params.section === 'tasks';
}

export function showMessengerListPlaceholder(
  data: unknown,
  isPending: boolean,
): boolean {
  return isPending && data === undefined;
}
