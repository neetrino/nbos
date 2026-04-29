'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, Mail } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader, ErrorState, LoadingState } from '@/components/shared';
import { mailApi, type MailMessageRow, type MailThreadDetailDto } from '@/lib/api/mail';
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
  const [draftTo, setDraftTo] = useState('');
  const [draftCc, setDraftCc] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const draftDefaultsKey = useRef<string>('');

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
    if (!detail || !threadId) {
      return;
    }
    const key = `${threadId}:${detail.thread.id}`;
    if (draftDefaultsKey.current === key) {
      return;
    }
    draftDefaultsKey.current = key;
    setDraftTo(defaultReplyToFromMessages(detail.messages));
    setDraftCc('');
    setDraftSubject(defaultReplySubjectFromMessages(detail.messages));
    setDraftBody('');
    setDraftError(null);
  }, [detail, threadId]);

  const saveDraft = useCallback(async () => {
    if (!threadId || !detail) return;
    const to = splitEmailList(draftTo);
    if (to.length === 0) {
      setDraftError('Enter at least one To address.');
      return;
    }
    if (!draftSubject.trim()) {
      setDraftError('Subject is required.');
      return;
    }
    setDraftSaving(true);
    setDraftError(null);
    setError(null);
    try {
      const cc = splitEmailList(draftCc);
      const d = await mailApi.createOutboundDraft(threadId, {
        to,
        ...(cc.length > 0 ? { cc } : {}),
        subject: draftSubject.trim(),
        bodyText: draftBody,
      });
      setDetail(d);
      setDraftBody('');
    } catch (e) {
      setDraftError(getApiErrorMessage(e, 'Draft could not be saved.'));
    } finally {
      setDraftSaving(false);
    }
  }, [threadId, detail, draftTo, draftCc, draftSubject, draftBody]);

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
                      {m.deliveryStatus ? ` · ${m.deliveryStatus}` : ''}
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
          {canEdit ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reply as draft</CardTitle>
                <p className="text-muted-foreground text-xs">
                  Saved locally as DRAFT. No SMTP or provider send in this MVP.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {draftError ? <p className="text-destructive text-sm">{draftError}</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label
                      htmlFor="mail-draft-to"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      To (comma-separated)
                    </label>
                    <Input
                      id="mail-draft-to"
                      value={draftTo}
                      onChange={(e) => setDraftTo(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label
                      htmlFor="mail-draft-cc"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Cc (optional)
                    </label>
                    <Input
                      id="mail-draft-cc"
                      value={draftCc}
                      onChange={(e) => setDraftCc(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label
                      htmlFor="mail-draft-subject"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Subject
                    </label>
                    <Input
                      id="mail-draft-subject"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label
                      htmlFor="mail-draft-body"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Body
                    </label>
                    <Textarea
                      id="mail-draft-body"
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      rows={5}
                      className="min-h-24 resize-y"
                    />
                  </div>
                </div>
                <Button type="button" disabled={draftSaving} onClick={() => void saveDraft()}>
                  {draftSaving ? 'Saving…' : 'Save draft'}
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function splitEmailList(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function defaultReplyToFromMessages(messages: MailMessageRow[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (!m || m.direction !== 'INBOUND') continue;
    const from = m.recipients.find((r) => r.kind === 'FROM');
    if (from?.email) return from.email;
  }
  return '';
}

function defaultReplySubjectFromMessages(messages: MailMessageRow[]): string {
  const sub =
    messages.find((m) => m.direction === 'INBOUND')?.subject ?? messages[0]?.subject ?? '';
  if (/^re:\s*/i.test(sub)) return sub;
  return sub ? `Re: ${sub}` : 'Re:';
}

function EmptyThreadPlaceholder() {
  return (
    <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Mail className="h-8 w-8" />
      <p className="text-sm">No messages in this thread.</p>
    </div>
  );
}
