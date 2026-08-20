import type { FilterConfig } from '@/components/shared/FilterBar';
import type { ListMailThreadsOptions } from '@/lib/api/mail';
import type { SearchFilterRecord } from '@/lib/persisted-client-state';
import { mailFolderListParams, type MailFolderKey } from '@/features/mail/mail-folder-config';

export const MAIL_SEARCH_FILTER_KEY = {
  mailbox: 'mailbox',
  read: 'read',
  link: 'link',
  assigned: 'assigned',
  direction: 'direction',
} as const;

export const MAIL_SEARCH_FILTER_VALUE = {
  all: 'all',
  unread: 'unread',
  needsLink: 'needsLink',
  mine: 'mine',
  sent: 'sent',
} as const;

const MAIL_ATTRIBUTE_FILTER_KEYS = [
  MAIL_SEARCH_FILTER_KEY.read,
  MAIL_SEARCH_FILTER_KEY.link,
  MAIL_SEARCH_FILTER_KEY.assigned,
  MAIL_SEARCH_FILTER_KEY.direction,
] as const;

export function buildMailSearchFilterConfigs(
  mailboxes: ReadonlyArray<{ id: string; emailAddress: string }>,
): FilterConfig[] {
  return [
    {
      key: MAIL_SEARCH_FILTER_KEY.mailbox,
      label: 'Mailbox',
      options: mailboxes.map((mailbox) => ({
        value: mailbox.id,
        label: mailbox.emailAddress,
      })),
    },
    {
      key: MAIL_SEARCH_FILTER_KEY.read,
      label: 'Read',
      options: [{ value: MAIL_SEARCH_FILTER_VALUE.unread, label: 'Unread' }],
    },
    {
      key: MAIL_SEARCH_FILTER_KEY.link,
      label: 'Link',
      options: [{ value: MAIL_SEARCH_FILTER_VALUE.needsLink, label: 'Needs link' }],
    },
    {
      key: MAIL_SEARCH_FILTER_KEY.assigned,
      label: 'Assigned',
      options: [{ value: MAIL_SEARCH_FILTER_VALUE.mine, label: 'Assigned to me' }],
    },
    {
      key: MAIL_SEARCH_FILTER_KEY.direction,
      label: 'Activity',
      options: [{ value: MAIL_SEARCH_FILTER_VALUE.sent, label: 'Sent' }],
    },
  ];
}

export function resolveMailSearchFilterValues(
  filters: SearchFilterRecord,
  mailboxId: string | null,
): Record<string, string> {
  return {
    [MAIL_SEARCH_FILTER_KEY.mailbox]: mailboxId ?? MAIL_SEARCH_FILTER_VALUE.all,
    [MAIL_SEARCH_FILTER_KEY.read]:
      filters[MAIL_SEARCH_FILTER_KEY.read] ?? MAIL_SEARCH_FILTER_VALUE.all,
    [MAIL_SEARCH_FILTER_KEY.link]:
      filters[MAIL_SEARCH_FILTER_KEY.link] ?? MAIL_SEARCH_FILTER_VALUE.all,
    [MAIL_SEARCH_FILTER_KEY.assigned]:
      filters[MAIL_SEARCH_FILTER_KEY.assigned] ?? MAIL_SEARCH_FILTER_VALUE.all,
    [MAIL_SEARCH_FILTER_KEY.direction]:
      filters[MAIL_SEARCH_FILTER_KEY.direction] ?? MAIL_SEARCH_FILTER_VALUE.all,
  };
}

export function hasActiveMailSearchFilters(filters: SearchFilterRecord): boolean {
  return MAIL_ATTRIBUTE_FILTER_KEYS.some((key) => {
    const value = filters[key];
    return Boolean(value) && value !== MAIL_SEARCH_FILTER_VALUE.all;
  });
}

export function mailSearchFilterListParams(filters: SearchFilterRecord): ListMailThreadsOptions {
  return {
    ...(filters[MAIL_SEARCH_FILTER_KEY.read] === MAIL_SEARCH_FILTER_VALUE.unread
      ? { unreadOnly: true }
      : {}),
    ...(filters[MAIL_SEARCH_FILTER_KEY.link] === MAIL_SEARCH_FILTER_VALUE.needsLink
      ? { needsLinkOnly: true }
      : {}),
    ...(filters[MAIL_SEARCH_FILTER_KEY.assigned] === MAIL_SEARCH_FILTER_VALUE.mine
      ? { assignedToMe: true }
      : {}),
    ...(filters[MAIL_SEARCH_FILTER_KEY.direction] === MAIL_SEARCH_FILTER_VALUE.sent
      ? { sentOnly: true }
      : {}),
  };
}

export function mergeMailInboxListParams(
  folder: MailFolderKey,
  filters: SearchFilterRecord,
  mailboxId: string | null,
): ListMailThreadsOptions {
  const folderParams = mailFolderListParams(folder);
  const filterParams = mailSearchFilterListParams(filters);
  return {
    ...folderParams,
    ...filterParams,
    ...(mailboxId ? { mailAccountId: mailboxId } : {}),
  };
}
