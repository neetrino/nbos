'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';
import {
  MAIL_FOLDERS,
  resolveMailFolderCount,
  type MailFolderKey,
} from '@/features/mail/mail-folder-config';
import { MAIL_FOLDER_ICONS } from '@/features/mail/mail-folder-icons';
import {
  MAIL_FOLDER_ASIDE_CLASS,
  MAIL_FOLDER_NAV_BUTTON_ACTIVE_CLASS,
  MAIL_FOLDER_NAV_BUTTON_CLASS,
  MAIL_FOLDER_NAV_BUTTON_IDLE_CLASS,
} from '@/features/mail/mail-ui-classes';

export interface MailFolderSidebarProps {
  accounts: MailAccountHealthSummaryRow[];
  filterAccountId: string | null;
  activeFolder: MailFolderKey;
  onSelectFolder: (folder: MailFolderKey) => void;
  className?: string;
}

export function MailFolderSidebar({
  accounts,
  filterAccountId,
  activeFolder,
  onSelectFolder,
  className,
}: MailFolderSidebarProps) {
  return (
    <aside className={cn(MAIL_FOLDER_ASIDE_CLASS, className)} aria-label="Mail folders">
      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-0.5 p-3">
          {MAIL_FOLDERS.map((folder) => {
            const count = resolveMailFolderCount(folder.key, accounts, filterAccountId);
            const Icon = MAIL_FOLDER_ICONS[folder.key];
            const active = activeFolder === folder.key;
            return (
              <button
                key={folder.key}
                type="button"
                onClick={() => onSelectFolder(folder.key)}
                className={cn(
                  MAIL_FOLDER_NAV_BUTTON_CLASS,
                  active ? MAIL_FOLDER_NAV_BUTTON_ACTIVE_CLASS : MAIL_FOLDER_NAV_BUTTON_IDLE_CLASS,
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{folder.label}</span>
                {count !== null ? (
                  <Badge
                    variant={active ? 'default' : 'secondary'}
                    className="shrink-0 tabular-nums"
                  >
                    {count}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
