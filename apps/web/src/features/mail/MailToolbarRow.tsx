'use client';

import { FolderOpen, Plus, RefreshCcw, Settings, Share2, Trash2 } from 'lucide-react';
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

export interface MailToolbarRowProps {
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  activeFolder: MailFolderKey;
  searchValue: string;
  filterConfigs: FilterConfig[];
  filterValues: Record<string, string>;
  canEdit: boolean;
  busy: boolean;
  syncingAccountId: string | null;
  onSelectAccount: (accountId: string | null) => void;
  onSelectFolder: (folder: MailFolderKey) => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (key: string, value: string) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  onSyncAccount: (accountId: string) => void;
  onShareAccount: (account: MailAccountHealthSummaryRow) => void;
  onDeleteAccount: (account: MailAccountHealthSummaryRow) => void;
  onConnectMailbox: () => void;
  onReconnectMailbox: (account: MailAccountHealthSummaryRow) => void;
}

export function MailToolbarRow({
  accounts,
  filterAccountId,
  activeFolder,
  searchValue,
  filterConfigs,
  filterValues,
  canEdit,
  busy,
  syncingAccountId,
  onSelectAccount,
  onSelectFolder,
  onSearchChange,
  onFilterChange,
  onClearAll,
  onRefresh,
  onSyncAccount,
  onShareAccount,
  onDeleteAccount,
  onConnectMailbox,
  onReconnectMailbox,
}: MailToolbarRowProps) {
  const selectedAccount =
    filterAccountId !== null
      ? accounts.find((account) => account.id === filterAccountId)
      : undefined;
  const isSyncing = filterAccountId !== null && syncingAccountId === filterAccountId;
  const activeFolderLabel =
    MAIL_FOLDERS.find((folder) => folder.key === activeFolder)?.label ?? 'Inbox';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MailAccountSwitcher
        accounts={accounts}
        filterAccountId={filterAccountId}
        disabled={busy}
        onSelectAccount={onSelectAccount}
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
        disabled={busy}
        title="Refresh"
        onClick={() => onRefresh()}
      >
        <RefreshCcw size={16} aria-hidden />
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
            return (
              <DropdownMenuItem
                key={folder.key}
                className="cursor-pointer justify-between"
                onClick={() => onSelectFolder(folder.key)}
              >
                <span>{folder.label}</span>
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
                disabled={busy || isSyncing}
                onClick={() => onSyncAccount(selectedAccount.id)}
              >
                <RefreshCcw className={isSyncing ? 'animate-spin' : ''} />
                Sync mailbox
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => onShareAccount(selectedAccount)}
              >
                <Share2 />
                Share mailbox
              </DropdownMenuItem>
              {selectedAccount.providerType === 'CORPORATE_IMAP_SMTP' ? (
                <DropdownMenuItem
                  className="cursor-pointer"
                  disabled={busy}
                  onClick={() => onReconnectMailbox(selectedAccount)}
                >
                  <RefreshCcw />
                  Reconnect mailbox
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="cursor-pointer"
                variant="destructive"
                disabled={busy}
                onClick={() => onDeleteAccount(selectedAccount)}
              >
                <Trash2 />
                Delete mailbox
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
