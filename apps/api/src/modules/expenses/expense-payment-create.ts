import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { notifySalaryExpensePayment } from '../employees/employee-wallet-notify.ops';
import { bufferWalletNotifications } from '../employees/wallet-notify-buffer';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { syncPartnerPayoutPaidFromExpense } from '../partners/partner-payout-batch.ops';
import {
  loadPayrollCashReleasesForExpense,
  preparePayrollCashPayment,
} from '../payroll-runs/payroll-salary-first-cash-apply';
import type { PayrollCashBonusAssignmentInput } from '../payroll-runs/payroll-salary-first-cash';
import { syncSalaryLinePaidFromExpenseLedger } from '../payroll-runs/payroll-salary-line-ledger-sync';
import { hasEncodedPayrollCash } from '../payroll-runs/payroll-salary-first-cash-notes';
import {
  hasPayrollCashRefundNotes,
  payrollCashLedgerPaidAmount,
} from '../payroll-runs/payroll-salary-first-cash-reverse-paid';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';
import { syncExpenseStatusWithPaymentLedger } from './expense-status-ledger-sync';
import { assertPostingPeriodOpenForBookedAt } from '../finance/journal/posting-period-guard';
import type { OperationalJournalService } from '../finance/journal/operational-journal.service';

export interface AddExpensePaymentInput {
  amount: number;
  paymentDate: string;
  notes?: string;
  bonusAssignments?: PayrollCashBonusAssignmentInput[];
  carryAmount?: string;
  idempotencyKey?: string;
  assignRemainingBonusCash?: boolean;
}

const PAYMENT_ERRORS = {
  amountPositive: 'Payment amount must be a positive number',
  dateInvalid: 'paymentDate must be a valid ISO date string',
  exceedsRemaining: 'Payment amount exceeds remaining balance for this expense',
} as const;

export async function createExpensePaymentRecord(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  input: AddExpensePaymentInput,
  opts?: {
    notify?: WalletInAppNotifySink;
    journal?: OperationalJournalService;
  },
): Promise<string> {
  const paymentDate = parsePaymentDate(input);
  const newPayment = parsePaymentAmount(input.amount);
  await assertPostingPeriodOpenForBookedAt(prisma, paymentDate);
  const written = await writeExpensePayment(
    prisma,
    expenseId,
    input,
    newPayment,
    paymentDate,
    opts,
  );
  await syncPartnerPayoutPaidFromExpense(prisma, expenseId);
  await notifyPayrollExpensePayment(prisma, expenseId, written.paymentId, newPayment, opts?.notify);
  return written.paymentId;
}

function parsePaymentAmount(amount: number): Decimal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException(PAYMENT_ERRORS.amountPositive);
  }
  return new Decimal(amount);
}

function parsePaymentDate(input: AddExpensePaymentInput): Date {
  const when = new Date(input.paymentDate);
  if (Number.isNaN(when.getTime())) {
    throw new BadRequestException(PAYMENT_ERRORS.dateInvalid);
  }
  return when;
}

type ExpensePaymentWriteDb = Pick<
  InstanceType<typeof PrismaClient>,
  'expense' | 'expensePayment' | 'salaryLine' | 'bonusRelease' | '$queryRaw'
>;

type WrittenExpensePayment = {
  paymentId: string;
  expenseName: string;
  projectId: string | null;
  productId: string | null;
};

async function writeExpensePayment(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  input: AddExpensePaymentInput,
  newPayment: Decimal,
  paymentDate: Date,
  opts?: {
    notify?: WalletInAppNotifySink;
    journal?: OperationalJournalService;
  },
): Promise<WrittenExpensePayment> {
  const buffered = bufferWalletNotifications();
  const written = await prisma.$transaction(async (tx) => {
    const committed = await commitLockedExpensePayment(
      tx,
      expenseId,
      input,
      newPayment,
      paymentDate,
    );
    const db = tx as InstanceType<typeof PrismaClient>;
    await syncExpenseStatusWithPaymentLedger(db, expenseId);
    await syncSalaryLinePaidFromExpenseLedger(
      db,
      expenseId,
      opts?.notify == null ? undefined : buffered.sink,
    );
    await appendExpensePaymentJournal(committed, newPayment, paymentDate, opts?.journal, tx);
    return committed;
  });
  await buffered.flush(opts?.notify);
  return written;
}

async function commitLockedExpensePayment(
  tx: ExpensePaymentWriteDb,
  expenseId: string,
  input: AddExpensePaymentInput,
  newPayment: Decimal,
  paymentDate: Date,
): Promise<WrittenExpensePayment> {
  await tx.$queryRaw`SELECT id FROM expenses WHERE id = ${expenseId} FOR UPDATE`;
  const expense = await tx.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: true },
  });
  if (!expense) {
    throw new NotFoundException(`Expense ${expenseId} not found`);
  }
  const paid = sumExpensePaymentAmounts(expense.expensePayments);
  const remaining = expense.amount.minus(paid);
  const notes = await notesForExpensePayment(
    tx,
    expenseId,
    input,
    newPayment,
    paid,
    remaining,
    expense.expensePayments,
  );
  if (notes.existingPaymentId != null) {
    return writtenPayment(notes.existingPaymentId, expense);
  }
  const payment = await tx.expensePayment.create({
    data: {
      expenseId,
      amount: input.amount,
      paymentDate,
      notes: notes.notes,
    },
  });
  return writtenPayment(payment.id, expense);
}

function writtenPayment(
  paymentId: string,
  expense: { name: string; projectId: string | null; productId: string | null },
): WrittenExpensePayment {
  return {
    paymentId,
    expenseName: expense.name,
    projectId: expense.projectId,
    productId: expense.productId,
  };
}

async function notesForExpensePayment(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'salaryLine' | 'bonusRelease'>,
  expenseId: string,
  input: AddExpensePaymentInput,
  newPayment: Decimal,
  alreadyPaid: Decimal,
  remaining: Decimal,
  existingPayments: { id: string; amount: Decimal; notes: string | null }[],
): Promise<{ notes: string | null; existingPaymentId: string | null }> {
  const payroll = await loadPayrollCashReleasesForExpense(prisma, expenseId);
  if (payroll.salaryLine == null) {
    if (newPayment.gt(remaining)) {
      throw new BadRequestException(PAYMENT_ERRORS.exceedsRemaining);
    }
    return { notes: input.notes?.trim() ? input.notes.trim() : null, existingPaymentId: null };
  }
  const prepared = preparePayrollCashPayment({
    cash: newPayment,
    alreadyPaidCash: payrollAlreadyPaidCash(existingPayments, alreadyPaid),
    baseSalary: payroll.salaryLine.baseSalary,
    carryAppliedAmount: payroll.salaryLine.payrollCarryAppliedAmount,
    releases: payroll.releases,
    existingPayments,
    assignments: input.bonusAssignments,
    carryAmount: input.carryAmount,
    assignRemainingBonusCash: input.assignRemainingBonusCash,
    userNotes: input.notes,
    idempotencyKey: input.idempotencyKey,
  });
  if (prepared.existingPayment?.id != null) {
    return { notes: prepared.notes, existingPaymentId: prepared.existingPayment.id };
  }
  if (newPayment.gt(remaining)) {
    throw new BadRequestException(PAYMENT_ERRORS.exceedsRemaining);
  }
  return { notes: prepared.notes, existingPaymentId: null };
}

async function appendExpensePaymentJournal(
  written: {
    paymentId: string;
    expenseName: string;
    projectId: string | null;
    productId: string | null;
  },
  amount: Decimal,
  bookedAt: Date,
  journal: OperationalJournalService | undefined,
  db: Pick<PrismaClient, 'operationalJournalEntry' | 'financePostingPeriod'>,
): Promise<void> {
  if (journal == null) {
    return;
  }
  await journal.appendExpensePaymentLine(
    {
      expensePaymentId: written.paymentId,
      expenseName: written.expenseName,
      amount: amount.toNumber(),
      bookedAt,
      projectId: written.projectId,
      productId: written.productId,
    },
    db,
  );
}

async function notifyPayrollExpensePayment(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  paymentId: string,
  amount: Decimal,
  notify?: WalletInAppNotifySink,
): Promise<void> {
  if (!notify) {
    return;
  }
  const salaryCtx = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: {
      salaryLine: {
        select: {
          employeeId: true,
          status: true,
          payrollRun: { select: { payrollMonth: true } },
        },
      },
    },
  });
  const sl = salaryCtx?.salaryLine;
  if (!sl?.payrollRun) {
    return;
  }
  await notifySalaryExpensePayment(notify, {
    employeeId: sl.employeeId,
    paymentId,
    payrollMonth: sl.payrollRun.payrollMonth,
    amountLabel: amount.toFixed(2),
    expenseId,
    lineStatus: sl.status,
  });
}

export function payrollAlreadyPaidCash(
  existingPayments: { id: string; amount: Decimal; notes: string | null }[],
  alreadyPaid: Decimal,
): Decimal {
  if (hasEncodedPayrollCash(existingPayments) || hasPayrollCashRefundNotes(existingPayments)) {
    return payrollCashLedgerPaidAmount(existingPayments);
  }
  return alreadyPaid;
}
