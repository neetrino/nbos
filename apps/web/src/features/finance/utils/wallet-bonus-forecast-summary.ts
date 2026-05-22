import type { EmployeeWalletBonusRow, EmployeeWalletSnapshot } from '@/lib/api/me';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type WalletBonusForecastSummary = {
  incomingPlanned: number;
  inProgressPlanned: number;
  nextPayrollRemaining: number;
  paidFromReleases: number;
  correctionsPlanned: number;
};

/**
 * Client-side bonus forecast from wallet snapshot (NBOS — not bank balance).
 * Incoming = potential + in-progress planned; earned path = next payroll remaining + paid.
 */
export function summarizeWalletBonusForecast(
  bonuses: readonly EmployeeWalletBonusRow[],
): WalletBonusForecastSummary {
  let incomingPlanned = 0;
  let inProgressPlanned = 0;
  let nextPayrollRemaining = 0;
  let paidFromReleases = 0;
  let correctionsPlanned = 0;

  for (const row of bonuses) {
    const planned = parseAmount(row.amount);
    const remaining = parseAmount(row.remainingAmount);
    const paid = parseAmount(row.paidAmount);

    switch (row.walletGroup) {
      case 'POTENTIAL':
        incomingPlanned += planned;
        break;
      case 'IN_PROGRESS':
        inProgressPlanned += planned;
        break;
      case 'NEXT_PAYROLL':
        nextPayrollRemaining += remaining > 0 ? remaining : planned;
        paidFromReleases += paid;
        break;
      case 'PAID':
        paidFromReleases += paid > 0 ? paid : planned;
        break;
      case 'CORRECTIONS':
        correctionsPlanned += planned;
        break;
      default:
        break;
    }
  }

  return {
    incomingPlanned,
    inProgressPlanned,
    nextPayrollRemaining,
    paidFromReleases,
    correctionsPlanned,
  };
}

export function nextPayrollBonusLineAmount(
  nextPayroll: EmployeeWalletSnapshot['nextPayroll'],
): number | null {
  if (!nextPayroll) {
    return null;
  }
  return parseAmount(nextPayroll.bonusesTotal);
}
