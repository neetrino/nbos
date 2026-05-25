import type { SalaryBoardEntry } from '@/features/finance/components/payroll/salary-board-entries';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type SalaryBoardFilteredTotals = {
  lineCount: number;
  payable: number;
  paid: number;
  remaining: number;
};

export function computeSalaryBoardFilteredTotals(
  entries: ReadonlyArray<SalaryBoardEntry>,
): SalaryBoardFilteredTotals {
  let payable = 0;
  let paid = 0;
  let remaining = 0;
  for (const entry of entries) {
    payable += parseAmount(entry.cell.totalPayable);
    paid += parseAmount(entry.cell.paidAmount);
    remaining += parseAmount(entry.cell.remainingAmount);
  }
  return { lineCount: entries.length, payable, paid, remaining };
}
