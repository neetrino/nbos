'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { mailApi, type MailAccountRow, type MailThreadListRow } from '@/lib/api/mail';
import { getApiErrorMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

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
  const [accounts, setAccounts] = useState<MailAccountRow[]>([]);
  const [threads, setThreads] = useState<MailThreadListRow[]>([]);
  const [filterAccountId, setFilterAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [acc, th] = await Promise.all([
        mailApi.listAccounts(),
        mailApi.listThreads(filterAccountId ?? undefined),
      ]);
      setAccounts(acc);
      setThreads(th);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Mail could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [filterAccountId]);

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
        description="Threads from mailboxes you own or that your role can list (ALL scope). Sync and compose are not wired yet."
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCcw size={14} /> Refresh
        </Button>
      </PageHeader>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_1fr]">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mailboxes</CardTitle>
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
              {accounts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No mailboxes yet.</p>
              ) : (
                accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setFilterAccountId(a.id)}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      filterAccountId === a.id ? 'bg-muted font-medium' : 'hover:bg-muted/60',
                    )}
                  >
                    <span className="block truncate">{a.emailAddress}</span>
                    <span className="text-muted-foreground block truncate text-xs">{a.status}</span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Threads</CardTitle>
            </CardHeader>
            <CardContent>
              {threads.length === 0 ? (
                <EmptyState
                  icon={Mail}
                  title="No threads"
                  description="Connect a mailbox or wait for sync once the Mail pipeline is enabled."
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
