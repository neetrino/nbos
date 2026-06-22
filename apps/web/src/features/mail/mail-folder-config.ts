import type { MailAccountHealthSummaryRow } from '@/lib/api/mail';

export type MailFolderKey = 'all' | 'unread' | 'mine' | 'sent' | 'needsLink' | 'spam' | 'trash';

export interface MailFolderDefinition {
  key: MailFolderKey;
  label: string;
}

/** Segments backed by `mailApi.listThreads` query params. */
export const MAIL_FOLDERS: MailFolderDefinition[] = [
  { key: 'all', label: 'Inbox' },
  { key: 'unread', label: 'Unread' },
  { key: 'mine', label: 'Mine' },
  { key: 'sent', label: 'Sent' },
  { key: 'needsLink', label: 'Needs link' },
  { key: 'spam', label: 'Spam' },
  { key: 'trash', label: 'Trash' },
];

export function mailFolderListParams(folder: MailFolderKey): {
  unreadOnly?: boolean;
  assignedToMe?: boolean;
  sentOnly?: boolean;
  needsLinkOnly?: boolean;
  spamOnly?: boolean;
  scope?: 'active' | 'trash';
} {
  switch (folder) {
    case 'unread':
      return { unreadOnly: true };
    case 'mine':
      return { assignedToMe: true };
    case 'sent':
      return { sentOnly: true };
    case 'needsLink':
      return { needsLinkOnly: true };
    case 'spam':
      return { spamOnly: true };
    case 'trash':
      return { scope: 'trash' };
    default:
      return { scope: 'active' };
  }
}

export function resolveMailFolderCount(
  folder: MailFolderKey,
  accounts: MailAccountHealthSummaryRow[],
  filterAccountId: string | null,
): number | null {
  const scoped = filterAccountId
    ? accounts.filter((account) => account.id === filterAccountId)
    : accounts;

  if (scoped.length === 0) {
    return null;
  }

  switch (folder) {
    case 'all': {
      const total = scoped.reduce((sum, account) => sum + account.threadCount, 0);
      return total > 0 ? total : null;
    }
    case 'unread': {
      const total = scoped.reduce((sum, account) => sum + account.unreadThreadCount, 0);
      return total > 0 ? total : null;
    }
    case 'needsLink': {
      const total = scoped.reduce((sum, account) => sum + account.needsLinkThreadCount, 0);
      return total > 0 ? total : null;
    }
    default:
      return null;
  }
}
