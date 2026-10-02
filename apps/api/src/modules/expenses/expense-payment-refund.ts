import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { BONUS_POOL_ZERO } from '../bonus/bonus-pool-decimal';
import { refreshConfirmedPoolPaidForExpense } from '../bonus/product-bonus-pool-paid-cash';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import { PAYROLL_CASH_TRANSACTION_TIMEOUT_MS } from '../payroll-runs/payroll-salary-first-cash-reverse';
import {
  assertPayrollCashHistoryOpen,
  lockPayrollCashHistoryForUpdate,
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
import type { OperationalJournalService } from '../finance/journal/operational-journal.service';

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

type WrittenPayrollCashRefund = RefundExpensePayrollCashResult & {
  expenseName: string;
  projectId: string | null;
  productId: string | null;
  cashAmount: Decimal;
};

/**
 * Records a refund against the original bonus links of a payroll expense payment.
 * Does not take the refund from fixed salary. Uncovered residual stays on the refund notes.
 */
export async function refundExpensePayrollCash(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  paymentId: string,
  input: RefundExpensePayrollCashInput,
  opts?: { journal?: OperationalJournalService },
): Promise<RefundExpensePayrollCashResult> {
  const paymentDate = parseRefundDate(input.paymentDate);
  await assertPostingPeriodOpenForBookedAt(prisma, paymentDate);
  await rejectClosedPayrollCashHistory(prisma, expenseId);
  const refundAmount = parseRefundAmount(input.amount);
  const reason = input.reason.trim();
  const written = await prisma.$transaction(
    async (tx) => {
      const committed = await commitLockedPayrollCashRefund(tx, expenseId, paymentId, {
        refundAmount,
        paymentDate,
        reason,
        idempotencyKey: input.idempotencyKey,
      });
      const db = tx as InstanceType<typeof PrismaClient>;
      await appendPayrollCashRefundJournal(committed, paymentDate, opts?.journal, db);
      await syncSalaryLineIfHistoryOpen(db, expenseId);
      return committed;
    },
    { timeout: PAYROLL_CASH_TRANSACTION_TIMEOUT_MS },
  );
  await refreshConfirmedPoolPaidForExpense(prisma, expenseId);
  return toRefundResult(written);
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
): Promise<WrittenPayrollCashRefund> {
  await tx.$queryRaw`SELECT id FROM expenses WHERE id = ${expenseId} FOR UPDATE`;
  await lockPayrollCashHistoryForUpdate(tx, expenseId);
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
  const cashAmount = refundStoredCashAmount(refund);
  const existing = findPayrollCashRefundForSource(expense.expensePayments, paymentId);
  const paymentIdResolved =
    existing?.id ?? (await insertRefundPayment(tx, expenseId, refund, input));
  return writtenRefund(refund, expense, paymentIdResolved, cashAmount, existing?.id != null);
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

async function insertRefundPayment(
  tx: ExpensePaymentWriteDb,
  expenseId: string,
  refund: EncodedPayrollCashRefund,
  input: { paymentDate: Date; reason: string },
): Promise<string> {
  const created = await tx.expensePayment.create({
    data: {
      expenseId,
      amount: refundStoredCashAmount(refund),
      paymentDate: input.paymentDate,
      notes: encodePayrollCashRefundNotes(refund, input.reason),
    },
  });
  return created.id;
}

function writtenRefund(
  refund: EncodedPayrollCashRefund,
  expense: { name: string; projectId: string | null; productId: string | null },
  paymentId: string,
  cashAmount: Decimal,
  alreadyApplied: boolean,
): WrittenPayrollCashRefund {
  return {
    ...refund,
    paymentId,
    alreadyApplied,
    expenseName: expense.name,
    projectId: expense.projectId,
    productId: expense.productId,
    cashAmount,
  };
}

function toRefundResult(written: WrittenPayrollCashRefund): RefundExpensePayrollCashResult {
  return {
    salaryAmount: written.salaryAmount,
    bonusParts: written.bonusParts,
    residualAmount: written.residualAmount,
    sourcePaymentId: written.sourcePaymentId,
    idempotencyKey: written.idempotencyKey,
    paymentId: written.paymentId,
    alreadyApplied: written.alreadyApplied,
  };
}

async function appendPayrollCashRefundJournal(
  written: WrittenPayrollCashRefund,
  bookedAt: Date,
  journal?: OperationalJournalService,
  db?: Pick<PrismaClient, 'operationalJournalEntry' | 'financePostingPeriod'>,
): Promise<void> {
  if (journal == null) {
    return;
  }
  await journal.appendExpensePaymentLine(
    {
      expensePaymentId: written.paymentId,
      expenseName: written.expenseName,
      amount: written.cashAmount.toNumber(),
      bookedAt,
      projectId: written.projectId,
      productId: written.productId,
    },
    db,
  );
}
