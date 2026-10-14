'use client';

import { type ReactNode, useState } from 'react';
import { Check, ChevronDown, ChevronRight, GripVertical, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';
import { mailAccountsForDailySwitcher } from '@/features/mail/mail-folder-config';
import {
  readDragAccountId,
  setMailboxRowDragImage,
  writeMailboxDragPayload,
} from '@/features/mail/mail-account-switcher-drag';
import {
  partitionMailAccountsByBucket,
  placeMailboxInList,
  type MailInboxGroup,
  type MailMailboxBucket,
  type MailMailboxListOverrides,
} from '@/features/mail/mail-mailbox-buckets';

const MAILBOX_ROW_CLASS =
  'group/mailbox-row relative flex items-center rounded-md px-2 py-1.5 text-sm';
const MAILBOX_ROW_HOVER_CLASS = 'hover:bg-muted';
const MAILBOX_ROW_SELECTED_CLASS = 'bg-muted text-foreground';

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
  inboxGroup: MailInboxGroup,
): string {
  if (filterAccountId !== null) {
    const account = accounts.find((row) => row.id === filterAccountId);
    return account?.emailAddress ?? 'Mailbox';
  }
  if (inboxGroup === 'company') {
    return 'Company';
  }
  if (inboxGroup === 'all') {
    return 'All mailboxes';
  }
  return 'My';
}

type DropHint = {
  bucket: MailMailboxBucket;
  beforeId: string | null;
};

interface MailboxRowProps {
  account: MailAccountHealthSummaryRow;
  selected: boolean;
  bucket: MailMailboxBucket;
  dropBeforeActive: boolean;
  onSelect: () => void;
  onDragEnd: () => void;
  onRowDragOver: (bucket: MailMailboxBucket, beforeId: string) => void;
  onRowDrop: (accountId: string, bucket: MailMailboxBucket, beforeId: string) => void;
}

function MailboxDragHandle({
  emailAddress,
  accountId,
  onDragEnd,
}: {
  emailAddress: string;
  accountId: string;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      className={cn(
        'bg-popover/90 text-muted-foreground absolute top-1/2 left-1 z-10 inline-flex size-7 -translate-y-1/2 cursor-grab items-center justify-center rounded-md shadow-sm',
        'opacity-0 group-hover/mailbox-row:opacity-100 focus-visible:opacity-100 active:cursor-grabbing',
      )}
      title="Drag to reorder or move between My and Company"
      aria-label={`Drag ${emailAddress}`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDragStart={(event) => {
        const row = event.currentTarget.parentElement;
        writeMailboxDragPayload(event, accountId, emailAddress);
        if (row instanceof HTMLElement) {
          setMailboxRowDragImage(event, row);
        }
      }}
      onDragEnd={onDragEnd}
    >
      <GripVertical className="size-3.5" aria-hidden />
    </button>
  );
}

function MailboxMenuRow({
  account,
  selected,
  bucket,
  dropBeforeActive,
  onSelect,
  onDragEnd,
  onRowDragOver,
  onRowDrop,
}: MailboxRowProps) {
  return (
    <div
      className={cn(
        MAILBOX_ROW_CLASS,
        MAILBOX_ROW_HOVER_CLASS,
        selected && MAILBOX_ROW_SELECTED_CLASS,
        dropBeforeActive && 'ring-border ring-1',
      )}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        onRowDragOver(bucket, account.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const draggedId = readDragAccountId(event);
        if (draggedId) {
          onRowDrop(draggedId, bucket, account.id);
        }
      }}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
      >
        <span className="min-w-0 flex-1 truncate">{account.emailAddress}</span>
        {accountStatusBadge(account.status)}
        {account.unreadThreadCount > 0 ? (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {account.unreadThreadCount}
          </Badge>
        ) : null}
      </button>
      <MailboxDragHandle
        emailAddress={account.emailAddress}
        accountId={account.id}
        onDragEnd={onDragEnd}
      />
    </div>
  );
}

interface BucketDropZoneProps {
  bucket: MailMailboxBucket;
  active: boolean;
  onDragOver: (hint: DropHint) => void;
  onDragLeave: () => void;
  onDrop: (accountId: string, target: MailMailboxBucket, beforeId: string | null) => void;
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
      className={cn('rounded-md', active && 'bg-muted')}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        onDragOver({ bucket, beforeId: null });
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
          onDrop(accountId, bucket, null);
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
  inboxGroup: MailInboxGroup;
  mailboxOverrides: MailMailboxListOverrides;
  disabled?: boolean;
  onSelectAccount: (accountId: string | null) => void;
  onSelectInboxGroup: (group: MailInboxGroup) => void;
  onMailboxOverridesChange: (next: MailMailboxListOverrides) => void;
}

export function MailAccountSwitcher({
  accounts,
  filterAccountId,
  inboxGroup,
  mailboxOverrides,
  disabled = false,
  onSelectAccount,
  onSelectInboxGroup,
  onMailboxOverridesChange,
}: MailAccountSwitcherProps) {
  const listedAccounts = mailAccountsForDailySwitcher(accounts, filterAccountId);
  const { my, company } = partitionMailAccountsByBucket(listedAccounts, mailboxOverrides);
  const label = accountLabel(filterAccountId, accounts, inboxGroup);
  const groupActive = (group: MailInboxGroup) => filterAccountId === null && inboxGroup === group;
  const companyExpanded = mailboxOverrides.companyExpanded;
  const [dropHint, setDropHint] = useState<DropHint | null>(null);

  const handlePlace = (accountId: string, target: MailMailboxBucket, beforeId: string | null) => {
    const account = listedAccounts.find((row) => row.id === accountId);
    if (!account) {
      return;
    }
    if (beforeId === accountId) {
      return;
    }
    const next = placeMailboxInList(
      mailboxOverrides,
      accountId,
      account.relation ?? 'owned',
      target,
      beforeId,
      my.map((row) => row.id),
      company.map((row) => row.id),
    );
    onMailboxOverridesChange(target === 'company' ? { ...next, companyExpanded: true } : next);
    setDropHint(null);
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
        <DropdownMenuItem
          className={cn('cursor-pointer', groupActive('all') && MAILBOX_ROW_SELECTED_CLASS)}
          onClick={() => onSelectInboxGroup('all')}
        >
          <span className="truncate">All mailboxes</span>
          {groupActive('all') ? <Check className="ml-auto size-4 shrink-0" aria-hidden /> : null}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <BucketDropZone
          bucket="my"
          active={dropHint?.bucket === 'my' && dropHint.beforeId === null}
          onDragOver={setDropHint}
          onDragLeave={() => setDropHint(null)}
          onDrop={handlePlace}
        >
          <DropdownMenuGroup>
            <DropdownMenuItem
              className={cn(
                'cursor-pointer text-xs font-medium',
                groupActive('my') && MAILBOX_ROW_SELECTED_CLASS,
              )}
              onClick={() => onSelectInboxGroup('my')}
            >
              <span className="truncate">My</span>
              {groupActive('my') ? <Check className="ml-auto size-4 shrink-0" aria-hidden /> : null}
            </DropdownMenuItem>
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
                  dropBeforeActive={dropHint?.bucket === 'my' && dropHint.beforeId === account.id}
                  onSelect={() => onSelectAccount(account.id)}
                  onDragEnd={() => setDropHint(null)}
                  onRowDragOver={(bucket, beforeId) => setDropHint({ bucket, beforeId })}
                  onRowDrop={handlePlace}
                />
              ))
            )}
          </DropdownMenuGroup>
        </BucketDropZone>
        <DropdownMenuSeparator />
        <BucketDropZone
          bucket="company"
          active={dropHint?.bucket === 'company' && dropHint.beforeId === null}
          onDragOver={(hint) => {
            setDropHint(hint);
            if (!companyExpanded) {
              onMailboxOverridesChange({ ...mailboxOverrides, companyExpanded: true });
            }
          }}
          onDragLeave={() => setDropHint(null)}
          onDrop={handlePlace}
        >
          <DropdownMenuGroup>
            <div className="flex items-center gap-0.5 pr-1">
              <button
                type="button"
                className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-sm"
                aria-label={companyExpanded ? 'Collapse Company' : 'Expand Company'}
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
              </button>
              <DropdownMenuItem
                className={cn(
                  'h-8 flex-1 cursor-pointer px-2 text-xs font-medium',
                  groupActive('company') && MAILBOX_ROW_SELECTED_CLASS,
                )}
                onClick={() => {
                  if (!companyExpanded) {
                    onMailboxOverridesChange({ ...mailboxOverrides, companyExpanded: true });
                  }
                  onSelectInboxGroup('company');
                }}
              >
                <span className="min-w-0 flex-1 truncate">Company</span>
                {company.length > 0 ? (
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {company.length}
                  </Badge>
                ) : null}
                {groupActive('company') ? (
                  <Check className="ml-auto size-4 shrink-0" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            </div>
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
                    dropBeforeActive={
                      dropHint?.bucket === 'company' && dropHint.beforeId === account.id
                    }
                    onSelect={() => onSelectAccount(account.id)}
                    onDragEnd={() => setDropHint(null)}
                    onRowDragOver={(bucket, beforeId) => setDropHint({ bucket, beforeId })}
                    onRowDrop={handlePlace}
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
