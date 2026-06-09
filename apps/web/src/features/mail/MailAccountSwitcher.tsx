'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';

function accountLabel(
  filterAccountId: string | null,
  accounts: MailAccountHealthSummaryRow[],
): string {
  if (filterAccountId === null) {
    return 'All mailboxes';
  }
  const account = accounts.find((row) => row.id === filterAccountId);
  return account?.emailAddress ?? 'Mailbox';
}

export interface MailAccountSwitcherProps {
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  disabled?: boolean;
  onSelectAccount: (accountId: string | null) => void;
}

export function MailAccountSwitcher({
  accounts,
  filterAccountId,
  disabled = false,
  onSelectAccount,
}: MailAccountSwitcherProps) {
  const label = accountLabel(filterAccountId, accounts);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        disabled={disabled}
        className={cn(
          'border-border bg-background hover:bg-muted/60 focus-visible:ring-ring inline-flex h-9 max-w-[min(100%,240px)] items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 disabled:opacity-50',
        )}
        aria-label="Switch mailbox"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuItem className="cursor-pointer" onClick={() => onSelectAccount(null)}>
          <Check
            className={cn(
              'size-4 shrink-0',
              filterAccountId === null ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />
          <span className="truncate">All mailboxes</span>
        </DropdownMenuItem>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-sm">No mailboxes connected.</p>
        ) : (
          accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              className="cursor-pointer"
              onClick={() => onSelectAccount(account.id)}
            >
              <Check
                className={cn(
                  'size-4 shrink-0',
                  filterAccountId === account.id ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{account.emailAddress}</span>
              {account.unreadThreadCount > 0 ? (
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {account.unreadThreadCount}
                </Badge>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
