'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { mailApi, type MailAccountHealthSummaryRow, type MailThreadListRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const MAIL_INBOX_SEARCH_DEBOUNCE_MS = 350;

function formatThreadTitle(subjectNormalized: string): string {
  const t = subjectNormalized.trim();
  if (t.length === 0) {
    return '(No subject)';
  }
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MailInboxPage() {
  const { can } = usePermission();
  const canView = can('VIEW', 'MAIL');
  const canEdit = can('EDIT', 'MAIL');
  const [accountHealth, setAccountHealth] = useState<MailAccountHealthSummaryRow[]>([]);
  const [threads, setThreads] = useState<MailThreadListRow[]>([]);
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  /** Inbox segment: all, unread-only, or needs-business-link only (mutually exclusive). */
  const [threadListSegment, setThreadListSegment] = useState<'all' | 'unread' | 'needs_link'>(
    'all',
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [threadSearchDraft, setThreadSearchDraft] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => {
      setThreadSearchQuery(threadSearchDraft.trim());
    }, MAIL_INBOX_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [threadSearchDraft]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, th] = await Promise.all([
        mailApi.listAccountHealthSummaries(),
        mailApi.listThreads(
          filterAccountId ?? undefined,
          threadListSegment === 'unread',
          threadListSegment === 'needs_link',
          threadSearchQuery || undefined,
        ),
      ]);
      setAccountHealth(health);
      setThreads(th);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Mail could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [filterAccountId, threadListSegment, threadSearchQuery]);

  const runSyncStub = useCallback(
    async (accountId: string) => {
      setSyncingAccountId(accountId);
      setError(null);
      try {
        await mailApi.recordMailAccountSyncStub(accountId);
        await load();
      } catch (e) {
        setError(getApiErrorMessage(e, 'Stub sync could not be recorded.'));
      } finally {
        setSyncingAccountId(null);
      }
    },
    [load],
  );

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    void load();
  }, [canView, load]);

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="Mail"
          description="Unified inbox for connected mailboxes (Phase 5 MVP)."
        />
        <EmptyState
          icon={Mail}
          title="No access"
          description="You do not have permission to view Mail."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Mail"
        description="Threads from mailboxes you own or that your role can list (ALL scope). Account health shows local thread counts and sync timestamps; live provider checks are not wired yet. Editors can run stub sync (timestamps only)."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={threadListSegment === 'all' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setThreadListSegment('all')}
          >
            All threads
          </Button>
          <Button
            type="button"
            variant={threadListSegment === 'unread' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setThreadListSegment('unread')}
          >
            Unread only
          </Button>
          <Button
            type="button"
            variant={threadListSegment === 'needs_link' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setThreadListSegment('needs_link')}
          >
            Needs link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </PageHeader>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mailboxes</CardTitle>
              <p className="text-muted-foreground text-xs">
                Health summary: threads / unread / needs link (same scope as inbox).
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setFilterAccountId(null)}
                className={cn(
                  'rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                  filterAccountId === null ? 'bg-muted font-medium' : 'hover:bg-muted/60',
                )}
              >
                All accessible
              </button>
              {accountHealth.length === 0 ? (
                <p className="text-muted-foreground text-sm">No mailboxes yet.</p>
              ) : (
                accountHealth.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      'flex items-start gap-0.5 rounded-md px-1 py-0.5',
                      filterAccountId === a.id ? 'bg-muted' : '',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setFilterAccountId(a.id)}
                      className={cn(
                        'min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                        filterAccountId === a.id ? 'font-medium' : 'hover:bg-muted/60',
                      )}
                    >
                      <span className="block truncate">{a.emailAddress}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {a.status}
                        {a.lastSyncAt ? ` · synced ${new Date(a.lastSyncAt).toLocaleString()}` : ''}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {a.threadCount} threads · {a.unreadThreadCount} unread ·{' '}
                        {a.needsLinkThreadCount} need link
                      </span>
                      {a.lastErrorAt ? (
                        <span className="text-destructive block text-xs">
                          Last error {new Date(a.lastErrorAt).toLocaleString()}
                        </span>
                      ) : null}
                    </button>
                    {canEdit ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground size-8 shrink-0"
                        disabled={loading || syncingAccountId === a.id}
                        title="Stub sync: updates last sync time only (no IMAP yet)"
                        onClick={(e) => {
                          e.preventDefault();
                          void runSyncStub(a.id);
                        }}
                      >
                        <RefreshCcw
                          size={14}
                          className={syncingAccountId === a.id ? 'animate-spin' : ''}
                        />
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3 pb-2">
              <CardTitle className="text-base">Threads</CardTitle>
              <Input
                type="search"
                placeholder="Search by subject…"
                value={threadSearchDraft}
                onChange={(e) => setThreadSearchDraft(e.target.value)}
                className="max-w-md"
                aria-label="Search threads by subject"
              />
            </CardHeader>
            <CardContent>
              {threads.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No threads"
                  description={
                    threadSearchQuery
                      ? 'No threads match this search. Try another term or clear the filter.'
                      : 'Connect a mailbox or wait for sync once the Mail pipeline is enabled.'
                  }
                />
              ) : (
                <ul className="divide-y rounded-md border">
                  {threads.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/mail/threads/${t.id}`}
                        className="hover:bg-muted/50 flex flex-col gap-0.5 px-3 py-3 text-sm"
                      >
                        <span className="font-medium">
                          {formatThreadTitle(t.subjectNormalized)}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {new Date(t.lastMessageAt).toLocaleString()}
                          {t.hasUnread ? ' · Unread' : ''}
                          {t.needsBusinessLink ? ' · Needs link' : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
