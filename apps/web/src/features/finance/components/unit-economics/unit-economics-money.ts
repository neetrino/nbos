import { parseMoneyAmount } from '@/features/finance/constants/finance';

export type UnitEconomicsSpentSource = {
  outFactAmount?: string;
  expensesPaidAmount?: string;
};

/** Spent field name differs between order rows and project/product roll-ups. */
export function unitEconomicsSpentRaw(row: UnitEconomicsSpentSource): string {
  return row.outFactAmount ?? row.expensesPaidAmount ?? '0';
}

export function parseUnitEconomicsSpent(row: UnitEconomicsSpentSource): number {
  return parseMoneyAmount(unitEconomicsSpentRaw(row));
}

export function parseUnitEconomicsMoney(raw: string | undefined): number {
  return parseMoneyAmount(raw);
}

export function unitEconomicsMarginClass(margin: number): string {
  if (margin < 0) return 'text-destructive';
  if (margin > 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}
