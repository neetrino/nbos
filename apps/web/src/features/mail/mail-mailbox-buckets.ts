import type { MailAccountViewerRelation } from '@/lib/api/mail';

export type MailMailboxBucket = 'my' | 'company';

export type MailMailboxListOverrides = {
  pinToMy: string[];
  pinToCompany: string[];
  /** Manual order of mailbox ids in My (unknown ids ignored; new ones append). */
  myOrder: string[];
  /** Manual order of mailbox ids in Company. */
  companyOrder: string[];
  companyExpanded: boolean;
};

export const EMPTY_MAIL_MAILBOX_LIST_OVERRIDES: MailMailboxListOverrides = {
  pinToMy: [],
  pinToCompany: [],
  myOrder: [],
  companyOrder: [],
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
    myOrder: parseIdList(record.myOrder),
    companyOrder: parseIdList(record.companyOrder),
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

export function applyMailboxListOrder<T extends { id: string }>(
  items: readonly T[],
  order: readonly string[],
): T[] {
  if (items.length <= 1 || order.length === 0) {
    return [...items];
  }
  const remaining = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  for (const id of order) {
    const item = remaining.get(id);
    if (!item) {
      continue;
    }
    ordered.push(item);
    remaining.delete(id);
  }
  for (const item of items) {
    if (remaining.has(item.id)) {
      ordered.push(item);
    }
  }
  return ordered;
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
  return {
    my: applyMailboxListOrder(my, overrides.myOrder),
    company: applyMailboxListOrder(company, overrides.companyOrder),
  };
}

function insertIdBefore(order: string[], accountId: string, beforeId: string | null): string[] {
  const without = order.filter((id) => id !== accountId);
  if (beforeId === null) {
    return [...without, accountId];
  }
  const index = without.indexOf(beforeId);
  if (index < 0) {
    return [...without, accountId];
  }
  return [...without.slice(0, index), accountId, ...without.slice(index)];
}

/**
 * Moves a mailbox into `target` (My/Company) and places it before `beforeId`
 * (or at the end when `beforeId` is null). `currentMyIds` / `currentCompanyIds`
 * are the currently displayed ordered lists (after partition).
 */
export function placeMailboxInList(
  overrides: MailMailboxListOverrides,
  accountId: string,
  relation: MailAccountViewerRelation,
  target: MailMailboxBucket,
  beforeId: string | null,
  currentMyIds: readonly string[],
  currentCompanyIds: readonly string[],
): MailMailboxListOverrides {
  const pinToMy = overrides.pinToMy.filter((id) => id !== accountId);
  const pinToCompany = overrides.pinToCompany.filter((id) => id !== accountId);
  const natural = defaultMailboxBucket(relation);
  const nextPins =
    target === natural
      ? { pinToMy, pinToCompany }
      : target === 'my'
        ? { pinToMy: [...pinToMy, accountId], pinToCompany }
        : { pinToMy, pinToCompany: [...pinToCompany, accountId] };

  let myIds = currentMyIds.filter((id) => id !== accountId);
  let companyIds = currentCompanyIds.filter((id) => id !== accountId);
  if (target === 'my') {
    myIds = insertIdBefore(myIds, accountId, beforeId);
  } else {
    companyIds = insertIdBefore(companyIds, accountId, beforeId);
  }

  return {
    ...overrides,
    ...nextPins,
    myOrder: myIds,
    companyOrder: companyIds,
  };
}

/** Append to the end of `target` (bucket-only move). */
export function moveMailboxToBucket(
  overrides: MailMailboxListOverrides,
  accountId: string,
  relation: MailAccountViewerRelation,
  target: MailMailboxBucket,
  currentMyIds: readonly string[] = [],
  currentCompanyIds: readonly string[] = [],
): MailMailboxListOverrides {
  return placeMailboxInList(
    overrides,
    accountId,
    relation,
    target,
    null,
    currentMyIds,
    currentCompanyIds,
  );
}
