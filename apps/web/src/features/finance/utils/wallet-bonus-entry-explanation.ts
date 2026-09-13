import type { EmployeeWalletBonusRow } from '@/lib/api/me';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type WalletBonusHintKey =
  | 'clawback'
  | 'paidTiming'
  | 'paid'
  | 'pendingEligibility'
  | 'potential'
  | 'partial'
  | 'kpiBurnedAmount'
  | 'includedInPayroll'
  | 'releasedUnpaid'
  | 'carryOverHint'
  | 'queued'
  | 'salesInProgress';

export type WalletBonusExplanation =
  | { source: 'message'; key: WalletBonusHintKey; values?: { amount?: string; month?: string } }
  | { source: 'raw'; text: string };

/**
 * Short help line for one wallet bonus card. Copy is resolved at render.
 */
export function resolveWalletBonusEntryExplanation(
  row: EmployeeWalletBonusRow,
): WalletBonusExplanation | null {
  if (row.status === 'CLAWBACK') {
    return { source: 'message', key: 'clawback' };
  }

  const planned = parseAmount(row.amount);
  const paid = parseAmount(row.paidAmount);
  const released = parseAmount(row.releasedAmount);
  const remaining = parseAmount(row.remainingAmount);

  if (row.walletGroup === 'PAID' || row.status === 'PAID') {
    if (remaining > 0) {
      return { source: 'message', key: 'paidTiming' };
    }
    return { source: 'message', key: 'paid' };
  }

  if (row.status === 'PENDING_ELIGIBILITY') {
    return { source: 'message', key: 'pendingEligibility' };
  }

  if (row.status === 'INCOMING' || row.status === 'EARNED') {
    return { source: 'message', key: 'potential' };
  }

  if (paid > 0 && remaining > 0) {
    return { source: 'message', key: 'partial' };
  }

  const burned = row.kpiBurnedAmount ? parseAmount(row.kpiBurnedAmount) : 0;
  if (burned > 0) {
    if (row.kpiBurnedReason?.trim()) {
      return { source: 'raw', text: row.kpiBurnedReason.trim() };
    }
    return { source: 'message', key: 'kpiBurnedAmount', values: { amount: burned.toFixed(2) } };
  }

  if (released > 0 && paid === 0 && row.payrollMonth) {
    return {
      source: 'message',
      key: 'includedInPayroll',
      values: { month: row.payrollMonth },
    };
  }

  if (released > 0 && paid === 0) {
    return { source: 'message', key: 'releasedUnpaid' };
  }

  const carryOver = row.payrollCarryOverAmount ? parseAmount(row.payrollCarryOverAmount) : 0;
  if (carryOver > 0) {
    return {
      source: 'message',
      key: 'carryOverHint',
      values: { amount: carryOver.toFixed(2) },
    };
  }

  if (row.walletGroup === 'NEXT_PAYROLL' && planned > 0) {
    return { source: 'message', key: 'queued' };
  }

  if (row.type === 'SALES' && row.salesAccrualHint) {
    return null;
  }

  if (row.type === 'SALES' && row.walletGroup === 'IN_PROGRESS') {
    return { source: 'message', key: 'salesInProgress' };
  }

  return null;
}
