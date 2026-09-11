'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS,
  DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS,
} from '@/components/shared/detail-sheet-classes';
import {
  ErrorState,
  LoadingState,
  ProfileAPermanentDeleteDialog,
  useDeleteConfirm,
} from '@/components/shared';
import { MailThreadDeleteDialog } from '@/features/mail/MailThreadDeleteDialog';
import { MailThreadDetailActions } from '@/features/mail/MailThreadDetailActions';
import { MailThreadMessages } from '@/features/mail/MailThreadMessages';
import { MailThreadReplyComposer } from '@/features/mail/MailThreadReplyComposer';
import { defaultForwardSubjectFromMessages } from '@/features/mail/mail-thread-helpers';
import type { useMailThreadDetail } from '@/features/mail/use-mail-thread-detail';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';

type MailThreadDetailState = ReturnType<typeof useMailThreadDetail>;

export interface MailThreadDetailContentProps {
  threadId: string;
  canEdit: boolean;
  detailState: MailThreadDetailState;
  /** Compact header for sheet; default page-style spacing when false. */
  compact?: boolean;
  onForward?: (payload: { mailAccountId: string; subject: string }) => void;
  onDeleted?: (threadId: string) => void;
  onRestored?: (threadId: string) => void;
  trashView?: boolean;
}

export function MailThreadDetailContent({
  threadId,
  canEdit,
  detailState,
  compact = false,
  onForward,
  onDeleted,
  onRestored,
  trashView = false,
}: MailThreadDetailContentProps) {
  const isMobileViewport = useIsMobileViewport();
  const useMobileSheetHeader = Boolean(compact && isMobileViewport);
  const {
    detail,
    setDetail,
    loading,
    error,
    load,
    markingRead,
    markingUnread,
    markingSpam,
    queueingMessageId,
    retryingSendMessageId,
    cancellingMessageId,
    retryingFailedMessageId,
    retryingAttachmentId,
    markRead,
    markUnread,
    markSpam,
    queueDraftForSend,
    retryFailedSend,
    cancelOutbound,
    resetFailedToDraft,
    retryAttachmentDownload,
  } = detailState;

  const [replyComposerOpen, setReplyComposerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [purgeError, setPurgeError] = useState<string | null>(null);
  const deleteConfirm = useDeleteConfirm<{ id: string; name: string }>();
  const permanentDeleteConfirm = useDeleteConfirm<{ id: string; name: string }>();
  const clearDeleteConfirm = deleteConfirm.clear;
  const clearPermanentDeleteConfirm = permanentDeleteConfirm.clear;

  useEffect(() => {
    setReplyComposerOpen(false);
    setDeleteError(null);
    setRestoreError(null);
    setPurgeError(null);
    clearDeleteConfirm();
    clearPermanentDeleteConfirm();
  }, [threadId, clearDeleteConfirm, clearPermanentDeleteConfirm]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (!detail) {
    return null;
  }

  const title = detail.messages[0]?.subject ?? detail.thread.subjectNormalized;
  const headerGap = compact ? 'gap-3' : 'gap-5';
  const isTrashView = trashView || detail.thread.trashedAt != null;
  const actionsBusy =
    markingRead ||
    markingUnread ||
    markingSpam ||
    retryingFailedMessageId !== null ||
    deleting ||
    restoring ||
    purging;

  const confirmRestore = async () => {
    setRestoring(true);
    setRestoreError(null);
    try {
      await mailApi.restoreThread(threadId);
      onRestored?.(threadId);
    } catch (restoreErr) {
      setRestoreError(getApiErrorMessage(restoreErr, 'Could not restore email.'));
    } finally {
      setRestoring(false);
    }
  };

  const confirmPermanentDelete = async () => {
    setPurging(true);
    setPurgeError(null);
    try {
      await mailApi.permanentDeleteThread(threadId);
      permanentDeleteConfirm.clear();
      onDeleted?.(threadId);
    } catch (purgeErr) {
      setPurgeError(getApiErrorMessage(purgeErr, 'Could not permanently delete email.'));
    } finally {
      setPurging(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.target) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await mailApi.deleteThread(deleteConfirm.target.id);
      deleteConfirm.clear();
      onDeleted?.(threadId);
    } catch (deleteErr) {
      setDeleteError(getApiErrorMessage(deleteErr, 'Could not delete email.'));
    } finally {
      setDeleting(false);
    }
  };

  const threadActionsProps = {
    isTrashView,
    hasUnread: detail.thread.hasUnread,
    isSpam: detail.thread.isSpam,
    actionsBusy,
    deleting,
    onReply: () => setReplyComposerOpen((open) => !open),
    onForward: () =>
      onForward?.({
        mailAccountId: detail.mailAccount.id,
        subject: defaultForwardSubjectFromMessages(detail.messages),
      }),
    onMarkRead: () => void markRead(),
    onMarkUnread: () => void markUnread(),
    onMarkSpam: () => void markSpam(),
    onMoveToTrash: () => deleteConfirm.request({ id: threadId, name: title }),
    onRestore: () => void confirmRestore(),
    onDeletePermanently: () => permanentDeleteConfirm.request({ id: threadId, name: title }),
  };

  return (
    <div className={`flex flex-col ${headerGap}`}>
      <div
        className={cn(
          useMobileSheetHeader
            ? cn(DETAIL_SHEET_MOBILE_HEADER_SHELL_CLASS, '-mx-5')
            : 'flex flex-wrap items-start justify-between gap-3',
        )}
      >
        {useMobileSheetHeader ? (
          <div className={DETAIL_SHEET_MOBILE_HEADER_BACK_ROW_CLASS}>
            {canEdit ? <MailThreadDetailActions layout="settings" {...threadActionsProps} /> : null}
          </div>
        ) : null}

        <div
          className={cn(
            useMobileSheetHeader
              ? cn(DETAIL_SHEET_MOBILE_HEADER_TITLE_BLOCK_CLASS, 'flex min-w-0 flex-col gap-2')
              : 'flex min-w-0 flex-1 flex-col gap-2',
          )}
        >
          <h2
            className={compact ? 'text-base leading-snug font-semibold' : 'text-2xl font-semibold'}
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {detail.mailAccount.emailAddress} · {detail.mailAccount.status}
            {detail.thread.needsBusinessLink ? ' · Needs business link' : ''}
          </p>
          {!useMobileSheetHeader && canEdit && detail.thread.hasUnread ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={actionsBusy}
                onClick={() => void markRead()}
              >
                <Check size={14} aria-hidden />
                Mark read
              </Button>
            </div>
          ) : null}
        </div>

        {canEdit && !useMobileSheetHeader ? (
          <MailThreadDetailActions layout="buttons" {...threadActionsProps} />
        ) : null}
        {restoreError ? (
          <p className={cn('text-destructive text-sm', useMobileSheetHeader && 'px-4')}>
            {restoreError}
          </p>
        ) : null}
        {purgeError ? (
          <p className={cn('text-destructive text-sm', useMobileSheetHeader && 'px-4')}>
            {purgeError}
          </p>
        ) : null}
      </div>

      <MailThreadMessages
        threadId={threadId}
        messages={detail.messages}
        canEdit={canEdit}
        queueingMessageId={queueingMessageId}
        retryingSendMessageId={retryingSendMessageId}
        cancellingMessageId={cancellingMessageId}
        retryingFailedMessageId={retryingFailedMessageId}
        retryingAttachmentId={retryingAttachmentId}
        onQueueDraft={queueDraftForSend}
        onRetryFailedSend={retryFailedSend}
        onCancelOutbound={cancelOutbound}
        onResetFailedToDraft={resetFailedToDraft}
        onRetryAttachmentDownload={retryAttachmentDownload}
      />
      {canEdit && replyComposerOpen ? (
        <MailThreadReplyComposer
          threadId={threadId}
          messages={detail.messages}
          onThreadUpdated={setDetail}
          onDismiss={() => setReplyComposerOpen(false)}
          onSent={() => setReplyComposerOpen(false)}
        />
      ) : null}

      <MailThreadDeleteDialog
        threadSubject={deleteConfirm.target?.name ?? title}
        open={deleteConfirm.open}
        isSubmitting={deleting}
        errorMessage={deleteError}
        onOpenChange={deleteConfirm.onOpenChange}
        onConfirm={() => void confirmDelete()}
      />

      <ProfileAPermanentDeleteDialog
        open={permanentDeleteConfirm.open}
        onOpenChange={permanentDeleteConfirm.onOpenChange}
        itemName={permanentDeleteConfirm.target?.name ?? title}
        entityLabel="email thread"
        isSubmitting={purging}
        onConfirm={() => void confirmPermanentDelete()}
      />
    </div>
  );
}
