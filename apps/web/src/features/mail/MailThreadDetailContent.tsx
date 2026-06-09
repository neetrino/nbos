'use client';

import { useEffect, useState } from 'react';
import { Check, Forward, MailOpen, Reply, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, useDeleteConfirm } from '@/components/shared';
import { MailThreadDeleteDialog } from '@/features/mail/MailThreadDeleteDialog';
import { MailThreadMessages } from '@/features/mail/MailThreadMessages';
import { MailThreadReplyComposer } from '@/features/mail/MailThreadReplyComposer';
import { defaultForwardSubjectFromMessages } from '@/features/mail/mail-thread-helpers';
import type { useMailThreadDetail } from '@/features/mail/use-mail-thread-detail';
import { mailApi } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';

type MailThreadDetailState = ReturnType<typeof useMailThreadDetail>;

export interface MailThreadDetailContentProps {
  threadId: string;
  canEdit: boolean;
  detailState: MailThreadDetailState;
  /** Compact header for sheet; default page-style spacing when false. */
  compact?: boolean;
  onForward?: (payload: { mailAccountId: string; subject: string }) => void;
  onDeleted?: (threadId: string) => void;
}

export function MailThreadDetailContent({
  threadId,
  canEdit,
  detailState,
  compact = false,
  onForward,
  onDeleted,
}: MailThreadDetailContentProps) {
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
    finalizingMessageId,
    cancellingMessageId,
    retryingFailedMessageId,
    markRead,
    markUnread,
    markSpam,
    queueDraftForSend,
    finalizeQueuedStub,
    cancelOutbound,
    resetFailedToDraft,
  } = detailState;

  const [replyComposerOpen, setReplyComposerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteConfirm = useDeleteConfirm<{ id: string; name: string }>();

  useEffect(() => {
    setReplyComposerOpen(false);
    setDeleteError(null);
    deleteConfirm.clear();
  }, [threadId, deleteConfirm.clear]);

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
  const actionsBusy =
    markingRead || markingUnread || markingSpam || retryingFailedMessageId !== null || deleting;

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

  return (
    <div className={`flex flex-col ${headerGap}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <h2
            className={compact ? 'text-base leading-snug font-semibold' : 'text-2xl font-semibold'}
          >
            {title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {detail.mailAccount.emailAddress} · {detail.mailAccount.status}
            {detail.thread.needsBusinessLink ? ' · Needs business link' : ''}
          </p>
          {canEdit && detail.thread.hasUnread ? (
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

        {canEdit ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => setReplyComposerOpen((open) => !open)}
            >
              <Reply size={16} aria-hidden />
              Reply
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() =>
                onForward?.({
                  mailAccountId: detail.mailAccount.id,
                  subject: defaultForwardSubjectFromMessages(detail.messages),
                })
              }
            >
              <Forward size={16} aria-hidden />
              Forward
            </Button>
            {!detail.thread.hasUnread ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2"
                disabled={actionsBusy}
                onClick={() => void markUnread()}
              >
                <MailOpen size={16} aria-hidden />
                Mark as unread
              </Button>
            ) : null}
            {!detail.thread.isSpam ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2"
                disabled={actionsBusy}
                onClick={() => void markSpam()}
              >
                <ShieldAlert size={16} aria-hidden />
                Spam
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="text-destructive hover:text-destructive gap-2"
              disabled={deleting}
              onClick={() => deleteConfirm.request({ id: threadId, name: title })}
            >
              <Trash2 size={16} aria-hidden />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      <MailThreadMessages
        threadId={threadId}
        messages={detail.messages}
        canEdit={canEdit}
        queueingMessageId={queueingMessageId}
        finalizingMessageId={finalizingMessageId}
        cancellingMessageId={cancellingMessageId}
        retryingFailedMessageId={retryingFailedMessageId}
        onQueueDraft={queueDraftForSend}
        onFinalizeQueuedStub={finalizeQueuedStub}
        onCancelOutbound={cancelOutbound}
        onResetFailedToDraft={resetFailedToDraft}
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
    </div>
  );
}
