import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import {
  assertPayrollCashHistoryOpen,
  rejectClosedPayrollCashHistory,
} from '../payroll-runs/payroll-salary-first-cash-reverse-apply';
import { decodePayrollCashNotes } from '../payroll-runs/payroll-salary-first-cash-notes';
import { refundStoredCashAmount } from '../payroll-runs/payroll-salary-first-cash-reverse-paid';
import {
  encodePayrollCashRefundNotes,
  findPayrollCashRefundForSource,
  PAYROLL_CASH_REVERSE_ERRORS,
  refundOriginalPayrollBonusCash,
  type EncodedPayrollCashRefund,
} from '../payroll-runs/payroll-salary-first-cash-reverse';
import { syncSalaryLinePaidFromExpenseLedger } from '../payroll-runs/payroll-salary-line-ledger-sync';
import { moneyAmount } from '../payroll-runs/payroll-allocation-source-amounts';

export type RefundExpensePayrollCashInput = {
  amount: number;
  paymentDate: string;
  reason: string;
  idempotencyKey?: string;
};

export type RefundExpensePayrollCashResult = EncodedPayrollCashRefund & {
  paymentId: string;
  alreadyApplied: boolean;
};

type ExpensePaymentWriteDb = Pick<
  InstanceType<typeof PrismaClient>,
  'expense' | 'expensePayment' | 'salaryLine' | '$queryRaw'
>;

/**
 * Records a refund against the original bonus links of a payroll expense payment.
 * Does not take the refund from fixed salary. Uncovered residual stays on the refund notes.
 */
export async function refundExpensePayrollCash(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  paymentId: string,
  input: RefundExpensePayrollCashInput,
): Promise<RefundExpensePayrollCashResult> {
  const paymentDate = parseRefundDate(input.paymentDate);
  await assertPostingPeriodOpenForBookedAt(prisma, paymentDate);
  await rejectClosedPayrollCashHistory(prisma, expenseId);
  const refundAmount = parseRefundAmount(input.amount);
  const reason = input.reason.trim();
  const written = await prisma.$transaction((tx) =>
    commitLockedPayrollCashRefund(tx, expenseId, paymentId, {
      refundAmount,
      paymentDate,
      reason,
      idempotencyKey: input.idempotencyKey,
    }),
  );
  await syncSalaryLineIfHistoryOpen(prisma, expenseId);
  return written;
}

async function commitLockedPayrollCashRefund(
  tx: ExpensePaymentWriteDb,
  expenseId: string,
  paymentId: string,
  input: {
    refundAmount: Decimal;
    paymentDate: Date;
    reason: string;
    idempotencyKey?: string;
  },
): Promise<RefundExpensePayrollCashResult> {
  await tx.$queryRaw`SELECT id FROM expenses WHERE id = ${expenseId} FOR UPDATE`;
  const expense = await tx.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: true },
  });
  if (!expense) {
    throw new NotFoundException(`Expense ${expenseId} not found`);
  }
  const source = expense.expensePayments.find((row) => row.id === paymentId);
  if (source == null) {
    throw new NotFoundException(`Expense payment ${paymentId} not found`);
  }
  const original = decodePayrollCashNotes(source.notes);
  if (original == null) {
    throw new BadRequestException(PAYROLL_CASH_REVERSE_ERRORS.originalLinksRequired);
  }
  const refund = refundOriginalPayrollBonusCash({
    original,
    refundAmount: input.refundAmount,
    sourcePaymentId: paymentId,
    idempotencyKey: input.idempotencyKey,
  });
  assertRefundReason(refund, input.reason);
  const existing = findPayrollCashRefundForSource(expense.expensePayments, paymentId);
  if (existing?.id != null) {
    return { ...refund, paymentId: existing.id, alreadyApplied: true };
  }
  const created = await tx.expensePayment.create({
    data: {
      expenseId,
      amount: refundStoredCashAmount(refund),
      paymentDate: input.paymentDate,
      notes: encodePayrollCashRefundNotes(refund, input.reason),
    },
  });
  return { ...refund, paymentId: created.id, alreadyApplied: false };
}

async function syncSalaryLineIfHistoryOpen(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
): Promise<void> {
  const history = await assertPayrollCashHistoryOpen(prisma, expenseId);
  if (history?.isClosed === true) {
    return;
  }
  await syncSalaryLinePaidFromExpenseLedger(prisma, expenseId);
}

function assertRefundReason(refund: EncodedPayrollCashRefund, reason: string): void {
  if (refund.residualAmount.gt(BONUS_POOL_ZERO) && reason.length === 0) {
    throw new BadRequestException(PAYROLL_CASH_REVERSE_ERRORS.residualReasonRequired);
  }
}

function parseRefundAmount(amount: number): Decimal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException(PAYROLL_CASH_REVERSE_ERRORS.refundPositive);
  }
  return moneyAmount(new Decimal(amount));
}

function parseRefundDate(paymentDate: string): Date {
  const when = new Date(paymentDate);
  if (Number.isNaN(when.getTime())) {
    throw new BadRequestException('paymentDate must be a valid ISO date string');
  }
  return when;
}
