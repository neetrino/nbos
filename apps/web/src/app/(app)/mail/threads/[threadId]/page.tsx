'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, Mail } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, ErrorState, LoadingState } from '@/components/shared';
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
          {detail.messages.length === 0 ? (
            <EmptyThreadPlaceholder />
          ) : (
            <div className="flex flex-col gap-4">
              {detail.messages.map((m) => (
                <Card key={m.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      {m.direction === 'INBOUND' ? 'Inbound' : 'Outbound'} · {m.readState}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground text-xs">
                      {m.recipients
                        .map((r) => `${r.kind}: ${r.displayName ?? r.email}`)
                        .join(' · ')}
                    </p>
                    <pre className="font-sans text-sm whitespace-pre-wrap">{m.bodyText ?? '—'}</pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function EmptyThreadPlaceholder() {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Mail className="h-8 w-8" />
      <p className="text-sm">No messages in this thread.</p>
    </div>
  );
}
