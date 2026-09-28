import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { restorePayrollBonusReleasesIncludedForSalaryLine } from './payroll-bonus-release-included-restore';
import {
  fullyPaidAttributedReleaseIds,
  loadPayrollCashReleasesForExpense,
} from './payroll-salary-first-cash-apply';
import type { EncodedPayrollCashAllocation } from './payroll-salary-first-cash-notes';
import { PAYROLL_CASH_LEDGER_PAYMENT_SELECT } from './payroll-salary-first-cash-reverse-paid';
import {
  decodePayrollCashRefundNotes,
  encodePayrollCashRefundNotes,
  PAYROLL_CASH_REVERSE_ERRORS,
} from './payroll-salary-first-cash-reverse';

const CLOSED_PAYROLL_RUN_STATUS = 'CLOSED';

export async function assertPayrollCashHistoryOpen(
  prisma: Pick<PrismaClient, 'salaryLine'>,
  expenseId: string,
): Promise<{ payrollRunId: string; isClosed: boolean } | null> {
  const salaryLine = await prisma.salaryLine.findUnique({
    where: { expenseId },
    select: {
      payrollRunId: true,
      payrollRun: { select: { status: true } },
    },
  });
  if (salaryLine == null) {
    return null;
  }
  const isClosed = salaryLine.payrollRun?.status === CLOSED_PAYROLL_RUN_STATUS;
  return { payrollRunId: salaryLine.payrollRunId, isClosed };
}

export async function rejectClosedPayrollCashHistory(
  prisma: Pick<PrismaClient, 'salaryLine'>,
  expenseId: string,
): Promise<void> {
  const history = await assertPayrollCashHistoryOpen(prisma, expenseId);
  if (history?.isClosed === true) {
    throw new BadRequestException(PAYROLL_CASH_REVERSE_ERRORS.closedHistory);
  }
}

export async function restoreBonusMarksForDeletedPayrollCash(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  original: EncodedPayrollCashAllocation | null,
): Promise<void> {
  if (original == null || original.bonusParts.length === 0) {
    return;
  }
  const payroll = await loadPayrollCashReleasesForExpense(prisma, expenseId);
  if (payroll.salaryLine == null) {
    return;
  }
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: { select: PAYROLL_CASH_LEDGER_PAYMENT_SELECT } },
  });
  const fullyPaid = new Set(
    fullyPaidAttributedReleaseIds(payroll.releases, expense?.expensePayments ?? []),
  );
  const toUnmark = [...new Set(original.bonusParts.map((part) => part.bonusReleaseId))].filter(
    (id) => !fullyPaid.has(id),
  );
  await restorePayrollBonusReleasesIncludedForSalaryLine(prisma, toUnmark);
}

export async function neutralizePayrollCashRefundsForSource(
  prisma: Pick<PrismaClient, 'expensePayment'>,
  expenseId: string,
  sourcePaymentId: string,
): Promise<string[]> {
  const rows = await prisma.expensePayment.findMany({
    where: { expenseId },
    select: { id: true, notes: true },
  });
  const neutralized: string[] = [];
  for (const row of rows) {
    const refundId = await neutralizeOneRefundForSource(prisma, row, sourcePaymentId);
    if (refundId != null) {
      neutralized.push(refundId);
    }
  }
  return neutralized;
}

async function neutralizeOneRefundForSource(
  prisma: Pick<PrismaClient, 'expensePayment'>,
  row: { id: string; notes: string | null },
  sourcePaymentId: string,
): Promise<string | null> {
  const refund = decodePayrollCashRefundNotes(row.notes);
  if (refund == null || refund.sourcePaymentId !== sourcePaymentId) {
    return null;
  }
  if (refund.bonusParts.length === 0) {
    return null;
  }
  await prisma.expensePayment.update({
    where: { id: row.id },
    data: {
      amount: BONUS_POOL_ZERO,
      notes: encodePayrollCashRefundNotes(
        { ...refund, bonusParts: [], salaryAmount: BONUS_POOL_ZERO },
        refundReasonFromNotes(row.notes),
      ),
    },
  });
  return row.id;
}

function refundReasonFromNotes(notes: string | null): string | null {
  if (notes == null) {
    return null;
  }
  const separator = notes.indexOf('\n');
  return separator >= 0 ? notes.slice(separator + 1) : null;
}
