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

const FOLDER_BUTTON_CLASS =
  'text-foreground focus-visible:ring-ring flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2';

function folderButtonClass(active: boolean): string {
  return cn(FOLDER_BUTTON_CLASS, active ? 'bg-muted font-medium' : 'hover:bg-muted/60');
}

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
    <aside
      className={cn(
        'border-border hidden w-44 shrink-0 flex-col border-r md:flex lg:w-48',
        className,
      )}
      aria-label="Mail folders"
    >
      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-0.5 p-2">
          {MAIL_FOLDERS.map((folder) => {
            const count = resolveMailFolderCount(folder.key, accounts, filterAccountId);
            return (
              <button
                key={folder.key}
                type="button"
                onClick={() => onSelectFolder(folder.key)}
                className={folderButtonClass(activeFolder === folder.key)}
                aria-current={activeFolder === folder.key ? 'page' : undefined}
              >
                <span>{folder.label}</span>
                {count !== null ? (
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
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
