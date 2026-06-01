import type { BonusEntryListRow } from '@/lib/api/bonus';

function parseAmount(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/** Payroll / release ceiling for a bonus entry. */
export function bonusEntryPayableCeiling(
  entry: Pick<BonusEntryListRow, 'payableAmount' | 'amount'>,
): number {
  const payable = entry.payableAmount;
  if (payable != null && payable.trim().length > 0) {
    return parseAmount(payable);
  }
  return parseAmount(entry.amount);
}

export function bonusEntryAutoPayable(entry: BonusEntryListRow): number {
  const factor = parseAmount(entry.kpiPayoutFactor ?? '1') || 1;
  return parseAmount(entry.amount) * factor;
}

export function bonusEntryPayableAdjustment(entry: BonusEntryListRow): number {
  return parseAmount(entry.payableAdjustment ?? '0');
}
