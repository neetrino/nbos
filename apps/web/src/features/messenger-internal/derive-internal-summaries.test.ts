import { describe, expect, it } from 'vitest';
import type { MessengerCoreConversationRow } from '@/lib/api/messenger-core';
import {
  deriveInternalVisibleSummaries,
  showMessengerListPlaceholder,
  usesSharedInternalAllDataset,
} from '@/features/messenger/query/derive-internal-summaries';

function row(
  id: string,
  type: MessengerCoreConversationRow['type'],
  unreadCount = 0,
): MessengerCoreConversationRow {
  return {
    id,
    zone: 'INTERNAL',
    type,
    title: id,
    status: 'ACTIVE',
    canonicalKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    lastMessageAt: '2026-09-01T00:00:00.000Z',
    unreadCount,
  };
}

describe('deriveInternalVisibleSummaries', () => {
  const items = [
    row('task-1', 'TASK', 2),
    row('group-1', 'INTERNAL_GROUP', 0),
    row('task-2', 'TASK', 0),
  ];

  it('does not share the All dataset for unread All or unread Tasks', () => {
    expect(usesSharedInternalAllDataset('all', '', 'unread')).toBe(false);
    expect(usesSharedInternalAllDataset('tasks', '', 'unread')).toBe(false);
    expect(usesSharedInternalAllDataset('all', '', 'all')).toBe(true);
  });

  it('derives Tasks locally from the All dataset without a second fetch shape', () => {
    expect(deriveInternalVisibleSummaries(items, 'all', 'all').map((item) => item.id)).toEqual([
      'task-1',
      'group-1',
      'task-2',
    ]);
    expect(deriveInternalVisibleSummaries(items, 'tasks', 'all').map((item) => item.id)).toEqual([
      'task-1',
      'task-2',
    ]);
    expect(deriveInternalVisibleSummaries(items, 'tasks', 'unread').map((item) => item.id)).toEqual([
      'task-1',
    ]);
  });

  it('shows a list placeholder only when no cached data exists', () => {
    expect(showMessengerListPlaceholder(undefined, true)).toBe(true);
    expect(showMessengerListPlaceholder({ items: [] }, true)).toBe(false);
    expect(showMessengerListPlaceholder({ items }, false)).toBe(false);
  });
});
