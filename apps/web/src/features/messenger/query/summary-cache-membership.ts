import type {
  MessengerCoreConversationRow,
  MessengerCoreConversationType,
  MessengerInternalSection,
} from '@/lib/api/messenger-core';
import type { ClientSummaryParams, InternalSummaryParams } from './messenger-query-keys';

export type SummaryMembership = 'insert' | 'exclude' | 'unknown';

const INTERNAL_SECTION_TYPES: Partial<
  Record<MessengerInternalSection, MessengerCoreConversationType>
> = {
  products: 'PRODUCT',
  tasks: 'TASK',
  deals: 'DEAL',
  groups: 'INTERNAL_GROUP',
  direct: 'DIRECT',
};

export function internalSummaryMembership(
  params: InternalSummaryParams,
  row: MessengerCoreConversationRow,
): SummaryMembership {
  if (row.zone !== 'INTERNAL') return 'exclude';
  if (row.status !== 'ACTIVE') return 'exclude';
  if (params.source === 'all-dataset') return 'insert';
  if (params.q.length > 0) return 'unknown';
  if (params.filter === 'mentions') return 'unknown';
  if (params.filter === 'unread') return (row.unreadCount ?? 0) > 0 ? 'insert' : 'exclude';
  const expected = INTERNAL_SECTION_TYPES[params.section];
  if (!expected) return 'unknown';
  return row.type === expected ? 'insert' : 'exclude';
}

export function clientSummaryMembership(
  _params: ClientSummaryParams,
  row: MessengerCoreConversationRow,
): SummaryMembership {
  if (row.zone !== 'CLIENT') return 'exclude';
  return 'unknown';
}

export function isInternalSummaryParams(value: unknown): value is InternalSummaryParams {
  if (!value || typeof value !== 'object' || !('source' in value)) return false;
  return value.source === 'all-dataset' || value.source === 'section';
}

export function isClientSummaryParams(value: unknown): value is ClientSummaryParams {
  if (!value || typeof value !== 'object') return false;
  return 'section' in value && 'q' in value && 'filter' in value && 'provider' in value;
}
