'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Pencil, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
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
import { ComposeMailDialog } from '@/features/mail/ComposeMailDialog';
import { ConnectMailboxDialog } from '@/features/mail/ConnectMailboxDialog';
import { MailboxSidebar } from '@/features/mail/MailboxSidebar';
import { ShareMailboxDialog } from '@/features/mail/ShareMailboxDialog';

const MAIL_INBOX_SEARCH_DEBOUNCE_MS = 350;

type MailThreadListSegment = 'all' | 'unread' | 'mine' | 'sent';

const MAIL_THREAD_SEGMENT_OPTIONS: PageHeroTabOption<MailThreadListSegment>[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mine', label: 'Mine' },
  { value: 'sent', label: 'Sent' },
];

function formatThreadTitle(subjectNormalized: string): string {
  const t = subjectNormalized.trim();
  return t.length === 0 ? '(No subject)' : t;
}

export default function MailInboxPage() {
  const router = useRouter();
  const { can } = usePermission();
  const canView = can('VIEW', 'MAIL');
  const canEdit = can('EDIT', 'MAIL');
  const [accountHealth, setAccountHealth] = useState<MailAccountHealthSummaryRow[]>([]);
  const [threads, setThreads] = useState<MailThreadListRow[]>([]);
  const [threadListMeta, setThreadListMeta] = useState<MailThreadListPageMeta | null>(null);
  const [threadPage, setThreadPage] = useState(1);
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  const [threadListSegment, setThreadListSegment] = useState<MailThreadListSegment>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [threadSearchDraft, setThreadSearchDraft] = useState('');
  const [threadSearchQuery, setThreadSearchQuery] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [shareAccount, setShareAccount] = useState<MailAccountHealthSummaryRow | null>(null);

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
        mailApi.listThreads({
          mailAccountId: filterAccountId ?? undefined,
          unreadOnly: threadListSegment === 'unread',
          assignedToMe: threadListSegment === 'mine',
          sentOnly: threadListSegment === 'sent',
          search: threadSearchQuery || undefined,
          page: threadPage,
        }),
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

  const runSync = useCallback(
    async (accountId: string) => {
      setSyncingAccountId(accountId);
      try {
        await mailApi.syncAccount(accountId);
        toast.success('Sync started.');
        await load();
      } catch (e) {
        toast.error(getApiErrorMessage(e, 'Sync could not be started.'));
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

  const selectAccount = (accountId: string | null) => {
    setThreadPage(1);
    setFilterAccountId(accountId);
  };

  if (!canView) {
    return (
      <div className="flex h-full flex-col gap-5">
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
    <div className="flex h-full flex-col gap-5">
      <PageHero
        title="Mail"
        tabs={
          <PageHeroTabs
            value={threadListSegment}
            onChange={(segment) => {
              setThreadPage(1);
              setThreadListSegment(segment);
            }}
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCcw size={14} aria-hidden />
              Refresh
            </Button>
            {canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setConnectOpen(true)}>
                <Plus size={14} aria-hidden />
                Connect mailbox
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                size="sm"
                onClick={() => setComposeOpen(true)}
                disabled={accountHealth.length === 0}
              >
                <Pencil size={14} aria-hidden />
                Compose
              </Button>
            ) : null}
          </div>
        }
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
          <MailboxSidebar
            accounts={accountHealth}
            filterAccountId={filterAccountId}
            canEdit={canEdit}
            syncingAccountId={syncingAccountId}
            busy={loading}
            onSelect={selectAccount}
            onSync={(id) => void runSync(id)}
            onShare={(account) => setShareAccount(account)}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Threads</CardTitle>
            </CardHeader>
            <CardContent>
              {threads.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No threads"
                  description={
                    threadSearchQuery
                      ? 'No threads match this search.'
                      : 'Connect a mailbox or wait for the next sync.'
                  }
                />
              ) : (
                <>
                  <ul className="divide-border divide-y rounded-md border">
                    {threads.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/mail/threads/${t.id}`}
                          className="hover:bg-muted/50 flex flex-col gap-0.5 px-3 py-3 text-sm"
                        >
                          <span className={t.hasUnread ? 'font-semibold' : 'font-medium'}>
                            {formatThreadTitle(t.subjectNormalized)}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(t.lastMessageAt).toLocaleString()}
                            {t.hasUnread ? ' · Unread' : ''}
                            {t.assignedToName ? ` · Assigned: ${t.assignedToName}` : ''}
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
                          variant="outline"
                          size="sm"
                          disabled={loading || !threadListMeta.hasPreviousPage}
                          onClick={() => setThreadPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={loading || !threadListMeta.hasNextPage}
                          onClick={() => setThreadPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <ConnectMailboxDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onConnected={() => void load()}
      />
      <ComposeMailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        accounts={accountHealth}
        defaultAccountId={filterAccountId}
        onSent={(threadId) => router.push(`/mail/threads/${threadId}`)}
      />
      {shareAccount ? (
        <ShareMailboxDialog
          open={shareAccount !== null}
          onOpenChange={(o) => {
            if (!o) setShareAccount(null);
          }}
          accountId={shareAccount.id}
          accountEmail={shareAccount.emailAddress}
        />
      ) : null}
    </div>
  );
}
