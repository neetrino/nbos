import { Decimal, type PrismaClient, type SalaryLineStatusEnum } from '@nbos/database';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { sumExpensePaymentAmounts } from '../expenses/expense-payment-rollup';
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
    include: { expensePayments: { select: { amount: true } } },
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

  if (status === 'PAID') {
    await markPayrollBonusReleasesPaidForSalaryLine(
      prisma,
      {
        payrollRunId: salaryLine.payrollRunId,
        employeeId: salaryLine.employeeId,
      },
      notify,
    );
  }
}
