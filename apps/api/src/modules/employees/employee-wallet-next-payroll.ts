import type { PayrollRunStatusEnum } from '@nbos/database';

/** Payroll runs that are not closed — employee’s “next” payout context (NBOS Employee Wallet). */
export const WALLET_OPEN_PAYROLL_STATUSES: PayrollRunStatusEnum[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
];

const OPEN_SET = new Set<string>(WALLET_OPEN_PAYROLL_STATUSES);

/**
 * Picks this employee’s salary line on the earliest open payroll month (lexicographic `YYYY-MM`).
 */
export function pickNextOpenPayrollSalaryLine<
  T extends { payrollRun: { payrollMonth: string; status: PayrollRunStatusEnum } },
>(lines: T[]): T | undefined {
  const candidates = lines.filter((l) => OPEN_SET.has(l.payrollRun.status));
  if (candidates.length === 0) {
    return undefined;
  }
  candidates.sort((a, b) => a.payrollRun.payrollMonth.localeCompare(b.payrollRun.payrollMonth));
  return candidates[0];
}
