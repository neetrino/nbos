'use client';

import { RefreshCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';
import { MailProviderConnectionBadge } from './MailProviderConnectionBadge';

interface MailboxSidebarProps {
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  canEdit: boolean;
  syncingAccountId: string | null;
  busy: boolean;
  onSelect: (accountId: string | null) => void;
  onSync: (accountId: string) => void;
  onShare: (account: MailAccountHealthSummaryRow) => void;
}

export function MailboxSidebar({
  accounts,
  filterAccountId,
  canEdit,
  syncingAccountId,
  busy,
  onSelect,
  onSync,
  onShare,
}: MailboxSidebarProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Mailboxes</CardTitle>
        <p className="text-muted-foreground text-xs">My mailboxes &amp; shared with me.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
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
            <div
              key={a.id}
              className={cn(
                'flex items-start gap-0.5 rounded-md px-1 py-0.5',
                filterAccountId === a.id ? 'bg-muted' : '',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className={cn(
                  'min-w-0 flex-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                  filterAccountId === a.id ? 'font-medium' : 'hover:bg-muted/60',
                )}
              >
                <span className="block truncate">{a.emailAddress}</span>
                <MailProviderConnectionBadge account={a} />
                <span className="text-muted-foreground block truncate text-xs">
                  {a.status}
                  {a.lastSyncAt ? ` · synced ${new Date(a.lastSyncAt).toLocaleString()}` : ''}
                </span>
                <span className="text-muted-foreground block text-xs">
                  {a.threadCount} threads · {a.unreadThreadCount} unread
                </span>
                {a.lastErrorAt ? (
                  <span className="text-destructive block text-xs">
                    Last error {new Date(a.lastErrorAt).toLocaleString()}
                  </span>
                ) : null}
              </button>
              {canEdit ? (
                <div className="flex shrink-0 flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8"
                    disabled={busy || syncingAccountId === a.id}
                    title="Sync now"
                    onClick={(e) => {
                      e.preventDefault();
                      onSync(a.id);
                    }}
                  >
                    <RefreshCcw
                      size={14}
                      className={syncingAccountId === a.id ? 'animate-spin' : ''}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-8"
                    title="Share mailbox"
                    onClick={(e) => {
                      e.preventDefault();
                      onShare(a);
                    }}
                  >
                    <Share2 size={14} />
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
