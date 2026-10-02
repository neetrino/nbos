import { Decimal, type PrismaClient, type SalaryLineStatusEnum } from '@nbos/database';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { sumExpensePaymentAmounts } from '../expenses/expense-payment-rollup';
import {
  fullyPaidAttributedReleaseIds,
  type PayrollCashReleaseRow,
} from './payroll-salary-first-cash-apply';
import { hasEncodedPayrollCash } from './payroll-salary-first-cash-notes';
import {
  hasPayrollCashRefundNotes,
  PAYROLL_CASH_LEDGER_PAYMENT_SELECT,
  payrollCashLedgerPaidAmount,
} from './payroll-salary-first-cash-reverse-paid';
import { encodedBonusReleaseIds } from './payroll-salary-first-cash-reverse';
import { restorePayrollBonusReleasesIncludedForSalaryLine } from './payroll-bonus-release-included-restore';
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
  const salaryLine = await loadOpenSalaryLineForExpense(prisma, expenseId);
  if (!salaryLine) {
    return;
  }
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: { select: PAYROLL_CASH_LEDGER_PAYMENT_SELECT } },
  });
  if (!expense) {
    return;
  }
  await writeSalaryLinePaidFromPayments(prisma, salaryLine, expense.expensePayments, notify);
}

async function loadOpenSalaryLineForExpense(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
): Promise<{
  id: string;
  payrollRunId: string;
  employeeId: string;
  totalPayable: Decimal;
} | null> {
  const salaryLine = await prisma.salaryLine.findUnique({
    where: { expenseId },
    select: {
      id: true,
      payrollRunId: true,
      employeeId: true,
      totalPayable: true,
      payrollRun: { select: { status: true } },
    },
  });
  if (!salaryLine || salaryLine.payrollRun?.status === 'CLOSED') {
    return null;
  }
  return salaryLine;
}

async function writeSalaryLinePaidFromPayments(
  prisma: InstanceType<typeof PrismaClient>,
  salaryLine: {
    id: string;
    payrollRunId: string;
    employeeId: string;
    totalPayable: Decimal;
  },
  payments: { id?: string; amount: Decimal; notes: string | null }[],
  notify?: WalletInAppNotifySink,
): Promise<void> {
  const paid = paidAmountFromExpensePayments(payments);
  const remaining = Decimal.max(new Decimal(0), salaryLine.totalPayable.minus(paid));
  const status = resolveSalaryLineStatus(salaryLine.totalPayable, paid);
  await prisma.salaryLine.update({
    where: { id: salaryLine.id },
    data: { paidAmount: paid, remainingAmount: remaining, status },
  });
  await recalculatePayrollRunTotalsFromSalaryLines(
    prisma as PayrollRunTotalsDb,
    salaryLine.payrollRunId,
  );
  await reconcilePayrollBonusCashPaidMarks(prisma, {
    payrollRunId: salaryLine.payrollRunId,
    employeeId: salaryLine.employeeId,
    lineStatus: status,
    payments,
    notify,
  });
}

async function reconcilePayrollBonusCashPaidMarks(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    payrollRunId: string;
    employeeId: string;
    lineStatus: SalaryLineStatusEnum;
    payments: { id?: string; amount: Decimal; notes: string | null }[];
    notify?: WalletInAppNotifySink;
  },
): Promise<void> {
  const releases = await prisma.bonusRelease.findMany({
    where: { payrollRunId: params.payrollRunId, employeeId: params.employeeId },
    select: { id: true, amount: true, payrollIncludedAmount: true, status: true },
  });
  const markIds = resolveReleaseIdsToMarkPaid(releases, params.payments, params.lineStatus);
  await markPayrollBonusReleasesPaidForSalaryLine(
    prisma,
    {
      payrollRunId: params.payrollRunId,
      employeeId: params.employeeId,
      releaseIds: markIds,
    },
    params.notify,
  );
  if (hasEncodedPayrollCash(params.payments) && markIds != null) {
    await restorePayrollBonusReleasesIncludedForSalaryLine(
      prisma,
      releaseIdsToUnmark(releases, params.payments, markIds),
    );
  }
}

function paidAmountFromExpensePayments(
  payments: { id?: string; amount: Decimal; notes: string | null }[],
): Decimal {
  if (hasEncodedPayrollCash(payments) || hasPayrollCashRefundNotes(payments)) {
    return payrollCashLedgerPaidAmount(payments);
  }
  return sumExpensePaymentAmounts(payments);
}

function resolveReleaseIdsToMarkPaid(
  releases: PayrollCashReleaseRow[],
  payments: { id?: string; amount: Decimal; notes: string | null }[],
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

function releaseIdsToUnmark(
  releases: PayrollCashReleaseRow[],
  payments: { id?: string; amount: Decimal; notes: string | null }[],
  fullyPaidIds: string[],
): string[] {
  const fullyPaid = new Set(fullyPaidIds);
  const named = encodedBonusReleaseIds(payments);
  return releases
    .filter((row) => row.status === 'PAID' && named.has(row.id) && !fullyPaid.has(row.id))
    .map((row) => row.id);
}
