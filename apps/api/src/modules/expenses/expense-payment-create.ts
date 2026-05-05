import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { notifySalaryExpensePayment } from '../employees/employee-wallet-notify.ops';
import type { WalletInAppNotifySink } from '../employees/employee-wallet-notify.types';
import { syncSalaryLinePaidFromExpenseLedger } from '../payroll-runs/payroll-salary-line-ledger-sync';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';
import { syncExpenseStatusWithPaymentLedger } from './expense-status-ledger-sync';

export interface AddExpensePaymentInput {
  amount: number;
  paymentDate: string;
  notes?: string;
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
  opts?: { notify?: WalletInAppNotifySink },
): Promise<void> {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { expensePayments: true },
  });
  if (!expense) throw new NotFoundException(`Expense ${expenseId} not found`);

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new BadRequestException(PAYMENT_ERRORS.amountPositive);
  }

  const paid = sumExpensePaymentAmounts(expense.expensePayments);
  const remaining = expense.amount.minus(paid);
  const newPayment = new Decimal(input.amount);

  if (newPayment.gt(remaining)) {
    throw new BadRequestException(PAYMENT_ERRORS.exceedsRemaining);
  }

  const when = new Date(input.paymentDate);
  if (Number.isNaN(when.getTime())) {
    throw new BadRequestException(PAYMENT_ERRORS.dateInvalid);
  }

  const payment = await prisma.expensePayment.create({
    data: {
      expenseId,
      amount: input.amount,
      paymentDate: when,
      notes: input.notes?.trim() ? input.notes.trim() : null,
    },
  });

  await syncExpenseStatusWithPaymentLedger(prisma, expenseId);
  await syncSalaryLinePaidFromExpenseLedger(prisma, expenseId, opts?.notify);

  if (!opts?.notify) {
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

  await notifySalaryExpensePayment(opts.notify, {
    employeeId: sl.employeeId,
    paymentId: payment.id,
    payrollMonth: sl.payrollRun.payrollMonth,
    amountLabel: payment.amount.toFixed(2),
    expenseId,
    lineStatus: sl.status,
  });
}
