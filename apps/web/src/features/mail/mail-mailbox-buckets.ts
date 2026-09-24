import type { MailAccountViewerRelation } from '@/lib/api/mail';

export type MailMailboxBucket = 'my' | 'company';

export type MailMailboxListOverrides = {
  pinToMy: string[];
  pinToCompany: string[];
  companyExpanded: boolean;
};

export const EMPTY_MAIL_MAILBOX_LIST_OVERRIDES: MailMailboxListOverrides = {
  pinToMy: [],
  pinToCompany: [],
  companyExpanded: false,
};

export function parseMailMailboxListOverrides(raw: unknown): MailMailboxListOverrides {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_MAIL_MAILBOX_LIST_OVERRIDES };
  }
  const record = raw as Record<string, unknown>;
  return {
    pinToMy: parseIdList(record.pinToMy),
    pinToCompany: parseIdList(record.pinToCompany),
    companyExpanded: record.companyExpanded === true,
  };
}

function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export function defaultMailboxBucket(relation: MailAccountViewerRelation): MailMailboxBucket {
  return relation === 'tenant' ? 'company' : 'my';
}

export function resolveMailboxBucket(
  accountId: string,
  relation: MailAccountViewerRelation,
  overrides: MailMailboxListOverrides,
): MailMailboxBucket {
  if (overrides.pinToMy.includes(accountId)) {
    return 'my';
  }
  if (overrides.pinToCompany.includes(accountId)) {
    return 'company';
  }
  return defaultMailboxBucket(relation);
}

export function partitionMailAccountsByBucket<
  T extends { id: string; relation?: MailAccountViewerRelation },
>(accounts: readonly T[], overrides: MailMailboxListOverrides): { my: T[]; company: T[] } {
  const my: T[] = [];
  const company: T[] = [];
  for (const account of accounts) {
    const relation = account.relation ?? 'owned';
    if (resolveMailboxBucket(account.id, relation, overrides) === 'my') {
      my.push(account);
    } else {
      company.push(account);
    }
  }
  return { my, company };
}

export function moveMailboxToBucket(
  overrides: MailMailboxListOverrides,
  accountId: string,
  relation: MailAccountViewerRelation,
  target: MailMailboxBucket,
): MailMailboxListOverrides {
  const pinToMy = overrides.pinToMy.filter((id) => id !== accountId);
  const pinToCompany = overrides.pinToCompany.filter((id) => id !== accountId);
  const natural = defaultMailboxBucket(relation);
  if (target === natural) {
    return { ...overrides, pinToMy, pinToCompany };
  }
  if (target === 'my') {
    return { ...overrides, pinToMy: [...pinToMy, accountId], pinToCompany };
  }
  return { ...overrides, pinToMy, pinToCompany: [...pinToCompany, accountId] };
}
