'use client';

import { type DragEvent, type ReactNode, useState } from 'react';
import { Check, ChevronDown, ChevronRight, GripVertical, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';
import { mailAccountsForDailySwitcher } from '@/features/mail/mail-folder-config';
import {
  moveMailboxToBucket,
  partitionMailAccountsByBucket,
  type MailMailboxBucket,
  type MailMailboxListOverrides,
} from '@/features/mail/mail-mailbox-buckets';

const MAIL_DRAG_MIME = 'application/x-nbos-mail-account';

function accountStatusBadge(status: string) {
  if (status === 'NEEDS_RECONNECT') {
    return (
      <Badge variant="outline" className="shrink-0">
        Reconnect
      </Badge>
    );
  }
  if (status === 'DISABLED' || status === 'PAUSED') {
    return (
      <Badge variant="outline" className="shrink-0">
        Off
      </Badge>
    );
  }
  if (status === 'DEGRADED') {
    return (
      <Badge variant="outline" className="shrink-0">
        Degraded
      </Badge>
    );
  }
  return null;
}

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

function readDragAccountId(event: DragEvent): string | null {
  const raw =
    event.dataTransfer.getData(MAIL_DRAG_MIME) || event.dataTransfer.getData('text/plain');
  const id = raw.trim();
  return id.length > 0 ? id : null;
}

interface MailboxRowProps {
  account: MailAccountHealthSummaryRow;
  selected: boolean;
  bucket: MailMailboxBucket;
  onSelect: () => void;
  onDragEnd: () => void;
}

function MailboxMenuRow({ account, selected, bucket, onSelect, onDragEnd }: MailboxRowProps) {
  return (
    <div
      className={cn(
        'group/mailbox-row flex items-center gap-0.5 rounded-md px-1',
        'hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <button
        type="button"
        draggable
        className={cn(
          'text-muted-foreground inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md active:cursor-grabbing',
          'opacity-0 group-hover/mailbox-row:opacity-100 focus-visible:opacity-100',
          'group-hover/mailbox-row:text-accent-foreground',
        )}
        title="Drag to My or Company"
        aria-label={`Drag ${account.emailAddress}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDragStart={(event) => {
          event.dataTransfer.setData(MAIL_DRAG_MIME, account.id);
          event.dataTransfer.setData('text/plain', account.id);
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('application/x-nbos-mail-bucket', bucket);
        }}
        onDragEnd={onDragEnd}
      >
        <GripVertical className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-1 py-1.5 text-left text-sm"
        onClick={onSelect}
      >
        <Check
          className={cn('size-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate">{account.emailAddress}</span>
        {accountStatusBadge(account.status)}
        {account.unreadThreadCount > 0 ? (
          <Badge
            variant="secondary"
            className="group-hover/mailbox-row:bg-accent-foreground/15 group-hover/mailbox-row:text-accent-foreground shrink-0 tabular-nums"
          >
            {account.unreadThreadCount}
          </Badge>
        ) : null}
      </button>
    </div>
  );
}

interface BucketDropZoneProps {
  bucket: MailMailboxBucket;
  active: boolean;
  onDragOver: (bucket: MailMailboxBucket) => void;
  onDragLeave: () => void;
  onDrop: (accountId: string, target: MailMailboxBucket) => void;
  children: ReactNode;
}

function BucketDropZone({
  bucket,
  active,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}: BucketDropZoneProps) {
  return (
    <div
      className={cn('rounded-md', active && 'bg-accent/40')}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver(bucket);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          onDragLeave();
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const accountId = readDragAccountId(event);
        onDragLeave();
        if (accountId) {
          onDrop(accountId, bucket);
        }
      }}
    >
      {children}
    </div>
  );
}

export interface MailAccountSwitcherProps {
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  mailboxOverrides: MailMailboxListOverrides;
  disabled?: boolean;
  onSelectAccount: (accountId: string | null) => void;
  onMailboxOverridesChange: (next: MailMailboxListOverrides) => void;
}

export function MailAccountSwitcher({
  accounts,
  filterAccountId,
  mailboxOverrides,
  disabled = false,
  onSelectAccount,
  onMailboxOverridesChange,
}: MailAccountSwitcherProps) {
  const listedAccounts = mailAccountsForDailySwitcher(accounts, filterAccountId);
  const { my, company } = partitionMailAccountsByBucket(listedAccounts, mailboxOverrides);
  const label = accountLabel(filterAccountId, accounts);
  const companyExpanded = mailboxOverrides.companyExpanded;
  const [dropBucket, setDropBucket] = useState<MailMailboxBucket | null>(null);

  const handleDrop = (accountId: string, target: MailMailboxBucket) => {
    const account = listedAccounts.find((row) => row.id === accountId);
    if (!account) {
      return;
    }
    const next = moveMailboxToBucket(
      mailboxOverrides,
      accountId,
      account.relation ?? 'owned',
      target,
    );
    onMailboxOverridesChange(target === 'company' ? { ...next, companyExpanded: true } : next);
  };

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
        <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
        <ChevronDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-1">
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
        <DropdownMenuSeparator />
        <BucketDropZone
          bucket="my"
          active={dropBucket === 'my'}
          onDragOver={setDropBucket}
          onDragLeave={() => setDropBucket(null)}
          onDrop={handleDrop}
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
              My
            </DropdownMenuLabel>
            {my.length === 0 ? (
              <p className="text-muted-foreground px-2 py-1.5 text-sm">
                No mailboxes in My. Drop here to add.
              </p>
            ) : (
              my.map((account) => (
                <MailboxMenuRow
                  key={account.id}
                  account={account}
                  selected={filterAccountId === account.id}
                  bucket="my"
                  onSelect={() => onSelectAccount(account.id)}
                  onDragEnd={() => setDropBucket(null)}
                />
              ))
            )}
          </DropdownMenuGroup>
        </BucketDropZone>
        <DropdownMenuSeparator />
        <BucketDropZone
          bucket="company"
          active={dropBucket === 'company'}
          onDragOver={(bucket) => {
            setDropBucket(bucket);
            if (!companyExpanded) {
              onMailboxOverridesChange({ ...mailboxOverrides, companyExpanded: true });
            }
          }}
          onDragLeave={() => setDropBucket(null)}
          onDrop={handleDrop}
        >
          <DropdownMenuGroup>
            <button
              type="button"
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs font-medium"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() =>
                onMailboxOverridesChange({
                  ...mailboxOverrides,
                  companyExpanded: !companyExpanded,
                })
              }
            >
              {companyExpanded ? (
                <ChevronDown className="size-3.5 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              )}
              <span className="min-w-0 flex-1">Company</span>
              {company.length > 0 ? (
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {company.length}
                </Badge>
              ) : null}
            </button>
            {companyExpanded ? (
              company.length === 0 ? (
                <p className="text-muted-foreground px-2 py-1.5 text-sm">
                  Drop a mailbox here to hide it from My.
                </p>
              ) : (
                company.map((account) => (
                  <MailboxMenuRow
                    key={account.id}
                    account={account}
                    selected={filterAccountId === account.id}
                    bucket="company"
                    onSelect={() => onSelectAccount(account.id)}
                    onDragEnd={() => setDropBucket(null)}
                  />
                ))
              )
            ) : null}
          </DropdownMenuGroup>
        </BucketDropZone>
        {listedAccounts.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-sm">No mailboxes connected.</p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
