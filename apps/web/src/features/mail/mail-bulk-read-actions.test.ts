import { describe, expect, it } from 'vitest';
import {
  bulkMarkReadFailedTargets,
  bulkMarkReadPartialToast,
  bulkMarkReadSuccessToast,
  bulkMarkReadSucceededTargets,
  bulkMarkThreadIds,
  selectReadBulkMarkTargets,
  selectUnreadBulkMarkTargets,
} from './mail-bulk-read-actions';
import type { MailThreadListRow } from '@/lib/api/mail';

function thread(id: string, hasUnread: boolean): MailThreadListRow {
  return {
    id,
    mailAccountId: 'acct-1',
    subjectNormalized: 'Subject',
    lastMessageAt: '2026-01-01T00:00:00.000Z',
    lastInboundAt: null,
    lastOutboundAt: null,
    hasUnread,
    needsBusinessLink: false,
    isSpam: false,
    status: 'ACTIVE',
    assignedToEmployeeId: null,
    assignedToName: null,
    trashedAt: null,
  };
}

describe('mail bulk read actions', () => {
  it('selects only unread selected threads for mark-read', () => {
    const threads = [thread('a', true), thread('b', false), thread('c', true)];
    const selected = new Set(['a', 'b', 'c', 'd']);

    expect(selectUnreadBulkMarkTargets(threads, selected).map((row) => row.id)).toEqual(['a', 'c']);
    expect(selectReadBulkMarkTargets(threads, selected).map((row) => row.id)).toEqual(['b']);
  });

  it('builds bulk payload thread ids in list order', () => {
    const targets = [thread('x', true), thread('y', true)];
    expect(bulkMarkThreadIds(targets)).toEqual(['x', 'y']);
  });

  it('splits succeeded and failed bulk mark-read targets', () => {
    const targets = [thread('a', true), thread('b', true), thread('c', true)];
    const result = {
      total: 3,
      succeeded: 2,
      failed: 1,
      succeededThreadIds: ['a', 'c'],
      failedItems: [{ threadId: 'b', error: 'denied' }],
    };

    expect(bulkMarkReadSucceededTargets(targets, result).map((row) => row.id)).toEqual(['a', 'c']);
    expect(bulkMarkReadFailedTargets(targets, result).map((row) => row.id)).toEqual(['b']);
  });

  it('formats bulk mark-read toast copy', () => {
    expect(bulkMarkReadSuccessToast(1)).toBe('Marked 1 thread as read.');
    expect(bulkMarkReadSuccessToast(3)).toBe('Marked 3 threads as read.');
    expect(
      bulkMarkReadPartialToast({
        total: 3,
        succeeded: 2,
        failed: 1,
        succeededThreadIds: ['a', 'b'],
        failedItems: [{ threadId: 'c', error: 'denied' }],
      }),
    ).toBe('Marked 2 of 3 threads as read. 1 failed.');
  });
});
