'use client';

import { FolderOpen, Plus, RefreshCcw, Settings, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IntegratedSearchFilters, type FilterConfig } from '@/components/shared';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';
import { MailAccountSwitcher } from '@/features/mail/MailAccountSwitcher';
import {
  MAIL_FOLDERS,
  resolveMailFolderCount,
  type MailFolderKey,
} from '@/features/mail/mail-folder-config';
import { MAIL_FOLDER_ICONS } from '@/features/mail/mail-folder-icons';
import type { MailMailboxListOverrides } from '@/features/mail/mail-mailbox-buckets';

export interface MailToolbarRowProps {
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  activeFolder: MailFolderKey;
  searchValue: string;
  filterConfigs: FilterConfig[];
  filterValues: Record<string, string>;
  mailboxOverrides: MailMailboxListOverrides;
  canEdit: boolean;
  busy: boolean;
  gettingMail: boolean;
  onSelectAccount: (accountId: string | null) => void;
  onSelectFolder: (folder: MailFolderKey) => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  onShareAccount: (account: MailAccountHealthSummaryRow) => void;
  onConnectMailbox: () => void;
  onMailboxSettings: (account: MailAccountHealthSummaryRow) => void;
  onMailboxOverridesChange: (next: MailMailboxListOverrides) => void;
}

export function MailToolbarRow({
  accounts,
  filterAccountId,
  activeFolder,
  searchValue,
  filterConfigs,
  filterValues,
  mailboxOverrides,
  canEdit,
  busy,
  gettingMail,
  onSelectAccount,
  onSelectFolder,
  onSearchChange,
  onFilterChange,
  onClearAll,
  onRefresh,
  onShareAccount,
  onConnectMailbox,
  onMailboxSettings,
  onMailboxOverridesChange,
}: MailToolbarRowProps) {
  const selectedAccount =
    filterAccountId !== null
      ? accounts.find((account) => account.id === filterAccountId)
      : undefined;
  const activeFolderLabel =
    MAIL_FOLDERS.find((folder) => folder.key === activeFolder)?.label ?? 'Inbox';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MailAccountSwitcher
        accounts={accounts}
        filterAccountId={filterAccountId}
        mailboxOverrides={mailboxOverrides}
        disabled={busy}
        onSelectAccount={onSelectAccount}
        onMailboxOverridesChange={onMailboxOverridesChange}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        disabled={busy || gettingMail}
        title="Get new mail"
        aria-label="Get new mail"
        onClick={() => onRefresh()}
      >
        <RefreshCcw size={16} aria-hidden className={gettingMail ? 'animate-spin' : undefined} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className="border-border bg-background hover:bg-muted/60 focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2 md:hidden"
          aria-label={`Folder: ${activeFolderLabel}`}
        >
          <FolderOpen size={16} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 md:hidden">
          {MAIL_FOLDERS.map((folder) => {
            const count = resolveMailFolderCount(folder.key, accounts, filterAccountId);
            const Icon = MAIL_FOLDER_ICONS[folder.key];
            return (
              <DropdownMenuItem
                key={folder.key}
                className="cursor-pointer justify-between"
                onClick={() => onSelectFolder(folder.key)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{folder.label}</span>
                </span>
                {count !== null ? (
                  <Badge variant="secondary" className="tabular-nums">
                    {count}
                  </Badge>
                ) : null}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="min-w-[12rem] flex-1">
        <IntegratedSearchFilters
          search={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by subject…"
          filters={filterConfigs}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className="border-border bg-background hover:bg-muted/60 focus-visible:ring-ring inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-2"
          aria-label="Mail settings"
        >
          <Settings size={16} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {canEdit && selectedAccount !== undefined ? (
            <>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onShareAccount(selectedAccount)}
              >
                <Share2 />
                Share mailbox
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={busy}
                onClick={() => onMailboxSettings(selectedAccount)}
              >
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {canEdit ? (
            <DropdownMenuItem className="cursor-pointer" onClick={() => onConnectMailbox()}>
              <Plus />
              Connect mailbox
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
