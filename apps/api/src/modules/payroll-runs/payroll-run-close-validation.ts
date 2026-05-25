import { Decimal, type TransactionClient } from '@nbos/database';
import type { SalaryLineStatusEnum } from '@nbos/database';

const CLOSE_ALLOWED_LINE_STATUSES: ReadonlySet<SalaryLineStatusEnum> = new Set(['PAID', 'HELD']);

/**
 * NBOS: payroll run may close only when every payable line is fully paid or explicitly held.
 */
export function findSalaryLinesBlockingPayrollClose(
  lines: ReadonlyArray<{ status: SalaryLineStatusEnum; totalPayable: Decimal }>,
): number {
  let count = 0;
  for (const line of lines) {
    if (line.totalPayable.lte(0)) continue;
    if (!CLOSE_ALLOWED_LINE_STATUSES.has(line.status)) {
      count += 1;
    }
  }
  return count;
}

export async function loadSalaryLinesBlockingPayrollCloseCount(
  tx: TransactionClient,
  payrollRunId: string,
): Promise<number> {
  const lines = await tx.salaryLine.findMany({
    where: { payrollRunId },
    select: { status: true, totalPayable: true },
  });
  return findSalaryLinesBlockingPayrollClose(lines);
}
