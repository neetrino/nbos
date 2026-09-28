import { Decimal, type PrismaClient, type SalaryLineStatusEnum } from '@nbos/database';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { sumExpensePaymentAmounts } from '../expenses/expense-payment-rollup';
import {
  fullyPaidAttributedReleaseIds,
  type PayrollCashReleaseRow,
} from './payroll-salary-first-cash-apply';
import { hasEncodedPayrollCash } from './payroll-salary-first-cash-notes';
import { markPayrollBonusReleasesPaidForSalaryLine } from './payroll-bonus-release-paid-mark';
import {
  recalculatePayrollRunTotalsFromSalaryLines,
  type PayrollRunTotalsDb,
} from './payroll-run-line-totals';

export function resolveSalaryLineStatus(
  totalPayable: Decimal,
  paid: Decimal,
): SalaryLineStatusEnum {
  if (totalPayable.lte(0)) {
    return 'PENDING';
  }
  if (paid.isZero()) {
    return 'APPROVED';
  }
  if (paid.lt(totalPayable)) {
    return 'PARTIALLY_PAID';
  }
  return 'PAID';
}

/**
 * When an expense is linked to a payroll salary line, keeps `paid_amount`, `remaining_amount`,
 * line `status`, and the parent `PayrollRun` paid totals aligned with `ExpensePayment` rows.
 * Bonus releases become PAID only from attributed cash, never because a draft exists.
 */
export async function syncSalaryLinePaidFromExpenseLedger(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  notify?: WalletInAppNotifySink,
): Promise<void> {
  const salaryLine = await prisma.salaryLine.findUnique({
    where: { expenseId },
    select: { id: true, payrollRunId: true, employeeId: true, totalPayable: true },
  });
  if (!salaryLine) {
    return;
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: { select: { amount: true, notes: true } } },
  });
  if (!expense) {
    return;
  }

  const paid = sumExpensePaymentAmounts(expense.expensePayments);
  const remaining = Decimal.max(new Decimal(0), salaryLine.totalPayable.minus(paid));
  const status = resolveSalaryLineStatus(salaryLine.totalPayable, paid);

  await prisma.salaryLine.update({
    where: { id: salaryLine.id },
    data: {
      paidAmount: paid,
      remainingAmount: remaining,
      status,
    },
  });

  await recalculatePayrollRunTotalsFromSalaryLines(
    prisma as PayrollRunTotalsDb,
    salaryLine.payrollRunId,
  );

  await reconcilePayrollBonusCashPaidMarks(prisma, {
    payrollRunId: salaryLine.payrollRunId,
    employeeId: salaryLine.employeeId,
    lineStatus: status,
    payments: expense.expensePayments,
    notify,
  });
}

async function reconcilePayrollBonusCashPaidMarks(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    payrollRunId: string;
    employeeId: string;
    lineStatus: SalaryLineStatusEnum;
    payments: { amount: Decimal; notes: string | null }[];
    notify?: WalletInAppNotifySink;
  },
): Promise<void> {
  const releases = await prisma.bonusRelease.findMany({
    where: { payrollRunId: params.payrollRunId, employeeId: params.employeeId },
    select: { id: true, amount: true, payrollIncludedAmount: true, status: true },
  });
  await markPayrollBonusReleasesPaidForSalaryLine(
    prisma,
    {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      releaseIds: resolveReleaseIdsToMarkPaid(releases, params.payments, params.lineStatus),
    },
    params.notify,
  );
}

function resolveReleaseIdsToMarkPaid(
  releases: PayrollCashReleaseRow[],
  payments: { amount: Decimal; notes: string | null }[],
  lineStatus: SalaryLineStatusEnum,
): string[] | undefined {
  if (hasEncodedPayrollCash(payments)) {
    return fullyPaidAttributedReleaseIds(releases, payments);
  }
  if (lineStatus === 'PAID') {
    return undefined;
  }
  return [];
}
