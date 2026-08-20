'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  mailApi,
  type MailBulkThreadActionResultDto,
  type MailThreadListRow,
} from '@/lib/api/mail';
import {
  bulkMarkReadFailedTargets,
  bulkMarkReadPartialToast,
  bulkMarkReadSuccessToast,
  bulkMarkThreadIds,
  bulkMarkUnreadPartialToast,
  bulkMarkUnreadSuccessToast,
  selectReadBulkMarkTargets,
  selectUnreadBulkMarkTargets,
} from '@/features/mail/mail-bulk-read-actions';

export interface UseMailBulkThreadReadParams {
  threads: MailThreadListRow[];
  selectedThreadIds: ReadonlySet<string>;
  onClearSelection: () => void;
  onMarkedRead: (threadId: string, mailAccountId: string) => void;
  onMarkedUnread: (threadId: string, mailAccountId: string) => void;
}

function applyOptimisticMarks(
  targets: MailThreadListRow[],
  apply: (thread: MailThreadListRow) => void,
): void {
  targets.forEach(apply);
}

function finishBackgroundBulkMark(params: {
  targets: MailThreadListRow[];
  result: MailBulkThreadActionResultDto;
  revert: (thread: MailThreadListRow) => void;
  successToast: (count: number) => string;
  partialToast: (result: MailBulkThreadActionResultDto) => string;
  allFailedMessage: string;
}): void {
  const failedTargets = bulkMarkReadFailedTargets(params.targets, params.result);
  failedTargets.forEach(params.revert);
  if (params.result.failed === 0) {
    toast.success(params.successToast(params.result.succeeded));
    return;
  }
  if (params.result.succeeded === 0) {
    toast.error(params.allFailedMessage);
    return;
  }
  toast.error(params.partialToast(params.result));
}

function startBackgroundBulkMark(params: {
  targets: MailThreadListRow[];
  applyOptimistic: (thread: MailThreadListRow) => void;
  revert: (thread: MailThreadListRow) => void;
  request: (threadIds: string[]) => Promise<MailBulkThreadActionResultDto>;
  successToast: (count: number) => string;
  partialToast: (result: MailBulkThreadActionResultDto) => string;
  allFailedMessage: string;
  catchMessage: string;
}): void {
  applyOptimisticMarks(params.targets, params.applyOptimistic);
  void params
    .request(bulkMarkThreadIds(params.targets))
    .then((result) => {
      finishBackgroundBulkMark({
        targets: params.targets,
        result,
        revert: params.revert,
        successToast: params.successToast,
        partialToast: params.partialToast,
        allFailedMessage: params.allFailedMessage,
      });
    })
    .catch((error: unknown) => {
      params.targets.forEach(params.revert);
      toast.error(getApiErrorMessage(error, params.catchMessage));
    });
}

/** Bulk read/unread runs after click; the inbox stays usable while the request finishes. */
export function useMailBulkThreadRead(params: UseMailBulkThreadReadParams): {
  runBulkMarkRead: () => void;
  runBulkMarkUnread: () => void;
} {
  const { threads, selectedThreadIds, onClearSelection, onMarkedRead, onMarkedUnread } = params;

  const runBulkMarkRead = useCallback(() => {
    const targets = selectUnreadBulkMarkTargets(threads, selectedThreadIds);
    if (targets.length === 0) {
      return;
    }
    onClearSelection();
    startBackgroundBulkMark({
      targets,
      applyOptimistic: (thread) => onMarkedRead(thread.id, thread.mailAccountId),
      revert: (thread) => onMarkedUnread(thread.id, thread.mailAccountId),
      request: (threadIds) => mailApi.bulkMarkThreadsRead(threadIds),
      successToast: bulkMarkReadSuccessToast,
      partialToast: bulkMarkReadPartialToast,
      allFailedMessage: 'Could not mark selected threads as read.',
      catchMessage: 'Bulk mark read failed.',
    });
  }, [onClearSelection, onMarkedRead, onMarkedUnread, selectedThreadIds, threads]);

  const runBulkMarkUnread = useCallback(() => {
    const targets = selectReadBulkMarkTargets(threads, selectedThreadIds);
    if (targets.length === 0) {
      return;
    }
    onClearSelection();
    startBackgroundBulkMark({
      targets,
      applyOptimistic: (thread) => onMarkedUnread(thread.id, thread.mailAccountId),
      revert: (thread) => onMarkedRead(thread.id, thread.mailAccountId),
      request: (threadIds) => mailApi.bulkMarkThreadsUnread(threadIds),
      successToast: bulkMarkUnreadSuccessToast,
      partialToast: bulkMarkUnreadPartialToast,
      allFailedMessage: 'Could not mark selected threads as unread.',
      catchMessage: 'Bulk mark unread failed.',
    });
  }, [onClearSelection, onMarkedRead, onMarkedUnread, selectedThreadIds, threads]);

  return { runBulkMarkRead, runBulkMarkUnread };
}
