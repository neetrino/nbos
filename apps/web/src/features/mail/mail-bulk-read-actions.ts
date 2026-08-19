import type { MailBulkThreadActionResultDto, MailThreadListRow } from '@/lib/api/mail';

export function selectUnreadBulkMarkTargets(
  threads: MailThreadListRow[],
  selectedThreadIds: ReadonlySet<string>,
): MailThreadListRow[] {
  return threads.filter((thread) => selectedThreadIds.has(thread.id) && thread.hasUnread);
}

export function selectReadBulkMarkTargets(
  threads: MailThreadListRow[],
  selectedThreadIds: ReadonlySet<string>,
): MailThreadListRow[] {
  return threads.filter((thread) => selectedThreadIds.has(thread.id) && !thread.hasUnread);
}

export function bulkMarkThreadIds(targets: MailThreadListRow[]): string[] {
  return targets.map((thread) => thread.id);
}

export function bulkMarkReadSucceededTargets(
  targets: MailThreadListRow[],
  result: MailBulkThreadActionResultDto,
): MailThreadListRow[] {
  const succeededSet = new Set(result.succeededThreadIds);
  return targets.filter((thread) => succeededSet.has(thread.id));
}

export function bulkMarkReadFailedTargets(
  targets: MailThreadListRow[],
  result: MailBulkThreadActionResultDto,
): MailThreadListRow[] {
  const succeededSet = new Set(result.succeededThreadIds);
  return targets.filter((thread) => !succeededSet.has(thread.id));
}

export function bulkMarkReadSuccessToast(total: number): string {
  return `Marked ${total} thread${total === 1 ? '' : 's'} as read.`;
}

export function bulkMarkUnreadSuccessToast(total: number): string {
  return `Marked ${total} thread${total === 1 ? '' : 's'} as unread.`;
}

export function bulkMarkReadPartialToast(result: MailBulkThreadActionResultDto): string {
  return `Marked ${result.succeeded} of ${result.total} thread${result.total === 1 ? '' : 's'} as read. ${result.failed} failed.`;
}

export function bulkMarkUnreadPartialToast(result: MailBulkThreadActionResultDto): string {
  return `Marked ${result.succeeded} of ${result.total} thread${result.total === 1 ? '' : 's'} as unread. ${result.failed} failed.`;
}
