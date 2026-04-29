'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader, ErrorState, LoadingState } from '@/components/shared';
import { MailThreadMessages } from '@/features/mail/MailThreadMessages';
import { MailThreadReplyDraftCard } from '@/features/mail/MailThreadReplyDraftCard';
import { mailApi, type MailThreadDetailDto } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';

export default function MailThreadDetailPage() {
  const params = useParams();
  const threadId = typeof params.threadId === 'string' ? params.threadId : '';
  const { can } = usePermission();
  const canView = can('VIEW', 'MAIL');
  const canEdit = can('EDIT', 'MAIL');
  const [detail, setDetail] = useState<MailThreadDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueingMessageId, setQueueingMessageId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const d = await mailApi.getThread(threadId);
      setDetail(d);
    } catch (e) {
      setDetail(null);
      setError(getApiErrorMessage(e, 'Thread could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  const markRead = useCallback(async () => {
    if (!threadId || !detail?.thread.hasUnread) return;
    setMarkingRead(true);
    setError(null);
    try {
      const d = await mailApi.markThreadRead(threadId);
      setDetail(d);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not mark thread as read.'));
    } finally {
      setMarkingRead(false);
    }
  }, [threadId, detail?.thread.hasUnread]);

  const queueDraftForSend = useCallback(
    async (messageId: string) => {
      if (!threadId) return;
      setQueueingMessageId(messageId);
      setError(null);
      try {
        const d = await mailApi.queueOutboundDraft(threadId, messageId);
        setDetail(d);
      } catch (e) {
        setError(getApiErrorMessage(e, 'Could not queue message.'));
      } finally {
        setQueueingMessageId(null);
      }
    },
    [threadId],
  );

  useEffect(() => {
    if (!canView || !threadId) {
      setLoading(false);
      return;
    }
    void load();
  }, [canView, threadId, load]);

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Mail" description="Thread detail" />
        <p className="text-muted-foreground text-sm">You do not have permission to view Mail.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Link
          href="/mail"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
        >
          <ArrowLeft size={16} /> Inbox
        </Link>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}

      {!loading && !error && detail ? (
        <>
          <PageHeader
            title={detail.messages[0]?.subject ?? detail.thread.subjectNormalized}
            description={`${detail.mailAccount.emailAddress} · ${detail.mailAccount.status}`}
          >
            {canEdit && detail.thread.hasUnread ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={markingRead}
                onClick={() => void markRead()}
              >
                <Check size={14} /> Mark read
              </Button>
            ) : null}
          </PageHeader>
          <MailThreadMessages
            messages={detail.messages}
            canEdit={canEdit}
            queueingMessageId={queueingMessageId}
            onQueueDraft={queueDraftForSend}
          />
          {canEdit ? (
            <MailThreadReplyDraftCard
              threadId={threadId}
              messages={detail.messages}
              onThreadUpdated={setDetail}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
