import { ENTITY_CODE_PREFIX, parseYearScopedEntityCode } from './entity-code-series';
import { ENTITY_CODE_SCOPE } from './entity-code-counter';

export interface EntityCodeSeedSeries {
  scope: string;
  table: string;
  prefix: string;
}

/**
 * Production series seeded into `entity_code_counters`. Regexes in the
 * migration must stay numerically equivalent to `parseYearScopedEntityCode`.
 */
export const ENTITY_CODE_SEED_SERIES: readonly EntityCodeSeedSeries[] = [
  { scope: ENTITY_CODE_SCOPE.task, table: 'tasks', prefix: ENTITY_CODE_PREFIX.task },
  { scope: ENTITY_CODE_SCOPE.invoice, table: 'invoices', prefix: ENTITY_CODE_PREFIX.invoice },
  {
    scope: ENTITY_CODE_SCOPE.supportTicket,
    table: 'support_tickets',
    prefix: ENTITY_CODE_PREFIX.supportTicket,
  },
  { scope: ENTITY_CODE_SCOPE.deal, table: 'deals', prefix: ENTITY_CODE_PREFIX.deal },
  { scope: ENTITY_CODE_SCOPE.lead, table: 'leads', prefix: ENTITY_CODE_PREFIX.lead },
  { scope: ENTITY_CODE_SCOPE.order, table: 'orders', prefix: ENTITY_CODE_PREFIX.order },
  {
    scope: ENTITY_CODE_SCOPE.subscription,
    table: 'subscriptions',
    prefix: ENTITY_CODE_PREFIX.subscription,
  },
  { scope: ENTITY_CODE_SCOPE.project, table: 'projects', prefix: ENTITY_CODE_PREFIX.project },
];

export interface SeededCounterRow {
  year: number;
  nextValue: number;
}

/**
 * Numeric max suffix per year. Malformed codes are ignored, never guessed.
 */
export function seedCountersFromCodes(
  codes: readonly string[],
  prefix: string,
): SeededCounterRow[] {
  const byYear = new Map<number, number>();
  for (const code of codes) {
    const parsed = parseYearScopedEntityCode(code, prefix);
    if (!parsed) {
      continue;
    }
    const current = byYear.get(parsed.year) ?? 0;
    if (parsed.numericSuffix > current) {
      byYear.set(parsed.year, parsed.numericSuffix);
    }
  }
  return [...byYear.entries()]
    .map(([year, nextValue]) => ({ year, nextValue }))
    .sort((left, right) => left.year - right.year);
}
