import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { Decimal } from '@nbos/database';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';

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

  await prisma.expensePayment.create({
    data: {
      expenseId,
      amount: input.amount,
      paymentDate: when,
      notes: input.notes?.trim() ? input.notes.trim() : null,
    },
  });
}
