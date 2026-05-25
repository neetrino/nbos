'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PageHero,
  PageHeroSearch,
  PageHeroTabs,
  EmptyState,
  ErrorState,
  LoadingState,
  type PageHeroTabOption,
} from '@/components/shared';
import {
  mailApi,
  type MailAccountHealthSummaryRow,
  type MailThreadListPageMeta,
  type MailThreadListRow,
} from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { MailProviderConnectionBadge } from '@/features/mail/MailProviderConnectionBadge';

const MAIL_INBOX_SEARCH_DEBOUNCE_MS = 350;

type MailThreadListSegment = 'all' | 'unread' | 'needs_link';

const MAIL_THREAD_SEGMENT_OPTIONS: PageHeroTabOption<MailThreadListSegment>[] = [
  { value: 'all', label: 'All threads' },
  { value: 'unread', label: 'Unread' },
  { value: 'needs_link', label: 'Needs link' },
];

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
  const [threadListMeta, setThreadListMeta] = useState<MailThreadListPageMeta | null>(null);
  const [threadPage, setThreadPage] = useState(1);
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  /** Inbox segment: all, unread-only, or needs-business-link only (mutually exclusive). */
  const [threadListSegment, setThreadListSegment] = useState<MailThreadListSegment>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [threadSearchDraft, setThreadSearchDraft] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => {
      setThreadPage(1);
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
          { page: threadPage },
        ),
      ]);
      setAccountHealth(health);
      setThreads(th.items);
      setThreadListMeta(th.meta);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Mail could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [filterAccountId, threadListSegment, threadSearchQuery, threadPage]);

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

  const handleThreadSegmentChange = (segment: MailThreadListSegment) => {
    setThreadPage(1);
    setThreadListSegment(segment);
  };

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHero title="Mail" />
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
      <PageHero
        title="Mail"
        tabs={
          <PageHeroTabs
            value={threadListSegment}
            onChange={handleThreadSegmentChange}
            options={MAIL_THREAD_SEGMENT_OPTIONS}
            ariaLabel="Inbox segment"
          />
        }
        search={
          <PageHeroSearch
            value={threadSearchDraft}
            onChange={setThreadSearchDraft}
            placeholder="Search by subject…"
          />
        }
        trailing={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCcw size={14} aria-hidden />
            Refresh
          </Button>
        }
      />

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
                onClick={() => {
                  setThreadPage(1);
                  setFilterAccountId(null);
                }}
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
                      onClick={() => {
                        setThreadPage(1);
                        setFilterAccountId(a.id);
                      }}
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
                      <MailProviderConnectionBadge account={a} />
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
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Threads</CardTitle>
            </CardHeader>
            <CardContent>
              {threads.length === 0 && (!threadListMeta || threadListMeta.totalCount === 0) ? (
                <EmptyState
                  icon={Mail}
                  title="No threads"
                  description={
                    threadSearchQuery
                      ? 'No threads match this search. Try another term or clear the filter.'
                      : 'Connect a mailbox or wait for sync once the Mail pipeline is enabled.'
                  }
                />
              ) : threads.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    No threads on this page. Try the previous page.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading || !threadListMeta?.hasPreviousPage}
                    onClick={() => setThreadPage((p) => Math.max(1, p - 1))}
                  >
                    Previous page
                  </Button>
                </div>
              ) : (
                <>
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
                  {threadListMeta && threadListMeta.totalPages > 1 ? (
                    <div className="text-muted-foreground mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span>
                        Page {threadListMeta.page} of {threadListMeta.totalPages} ·{' '}
                        {threadListMeta.totalCount} threads
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={loading || !threadListMeta.hasPreviousPage}
                          onClick={() => setThreadPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={loading || !threadListMeta.hasNextPage}
                          onClick={() => setThreadPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  ) : threadListMeta && threadListMeta.totalCount > 0 ? (
                    <p className="text-muted-foreground mt-2 text-xs">
                      {threadListMeta.totalCount} thread
                      {threadListMeta.totalCount === 1 ? '' : 's'}
                    </p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
