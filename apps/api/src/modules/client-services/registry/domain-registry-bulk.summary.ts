import type { DomainRegistryCheckOutcome } from './domain-registry.types';

/** `skipped`: the card name is not a valid FQDN, so there is nothing to look up. */
export type DomainRegistryBulkOutcome = DomainRegistryCheckOutcome | 'skipped';

export type DomainRegistryBulkCounts = Record<DomainRegistryBulkOutcome, number>;

export interface DomainRegistryBulkPageResult {
  /** Domain cards in the caller's scope (all pages). */
  total: number;
  /** Cards finished by this page; the next page starts after them. */
  checked: number;
  nextCursor: string | null;
  done: boolean;
  counts: DomainRegistryBulkCounts;
}

export function emptyDomainRegistryBulkCounts(): DomainRegistryBulkCounts {
  return {
    updated: 0,
    corrected: 0,
    unchanged: 0,
    not_found: 0,
    no_expiry: 0,
    failed: 0,
    skipped: 0,
  };
}

/**
 * Lanes finish out of id order. The cursor advances only over the leading run of finished
 * rows; finished rows after the first unfinished one are checked again on the next page.
 */
export function summarizeDomainRegistryBulkPage(input: {
  page: ReadonlyArray<{ id: string }>;
  outcomes: ReadonlyMap<string, DomainRegistryBulkOutcome>;
  total: number;
  cursor: string | null;
  pageHasMore: boolean;
}): DomainRegistryBulkPageResult {
  const firstPending = input.page.findIndex((row) => !input.outcomes.has(row.id));
  const finished = firstPending === -1 ? input.page : input.page.slice(0, firstPending);
  const counts = emptyDomainRegistryBulkCounts();
  for (const row of finished) {
    const outcome = input.outcomes.get(row.id);
    if (outcome) counts[outcome] += 1;
  }
  const pageFinished = finished.length === input.page.length;
  return {
    total: input.total,
    checked: finished.length,
    nextCursor: finished.at(-1)?.id ?? input.cursor,
    done: pageFinished && !input.pageHasMore,
    counts,
  };
}
