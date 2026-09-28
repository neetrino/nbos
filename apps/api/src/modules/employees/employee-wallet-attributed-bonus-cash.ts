import { Decimal, type PrismaClient } from '@nbos/database';

import { sumNetEncodedBonusCashByRelease } from '../payroll-runs/payroll-salary-first-cash-reverse';

export type WalletReleaseForAttributedCash = {
  id: string;
  payrollRunId: string | null;
};

type AttributedCashDb = Pick<InstanceType<typeof PrismaClient>, 'salaryLine' | 'expensePayment'>;

/**
 * Reads net bonus cash from payroll payment notes for this employee's salary expenses.
 * Does not infer paid cash from BonusRelease.status.
 */
export async function loadAttributedBonusCashByRelease(
  prisma: AttributedCashDb,
  employeeId: string,
  releases: readonly WalletReleaseForAttributedCash[],
): Promise<Map<string, Decimal>> {
  const runIds = uniqueRunIds(releases);
  if (runIds.length === 0) {
    return new Map();
  }
  const lines = await prisma.salaryLine.findMany({
    where: { employeeId, payrollRunId: { in: runIds }, expenseId: { not: null } },
    select: { expenseId: true },
  });
  const expenseIds = uniqueExpenseIds(lines);
  if (expenseIds.length === 0) {
    return new Map();
  }
  const payments = await prisma.expensePayment.findMany({
    where: { expenseId: { in: expenseIds } },
    select: { id: true, amount: true, notes: true },
  });
  return sumNetEncodedBonusCashByRelease(payments);
}

function uniqueRunIds(releases: readonly WalletReleaseForAttributedCash[]): string[] {
  const ids = new Set<string>();
  for (const release of releases) {
    if (release.payrollRunId != null && release.payrollRunId.length > 0) {
      ids.add(release.payrollRunId);
    }
  }
  return [...ids];
}

function uniqueExpenseIds(lines: readonly { expenseId: string | null }[]): string[] {
  const ids = new Set<string>();
  for (const line of lines) {
    if (line.expenseId != null && line.expenseId.length > 0) {
      ids.add(line.expenseId);
    }
  }
  return [...ids];
}
