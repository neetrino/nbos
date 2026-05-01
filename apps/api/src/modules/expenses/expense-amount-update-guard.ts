import { BadRequestException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { sumExpensePaymentAmounts } from './expense-payment-rollup';

const EXPENSE_AMOUNT_BELOW_PAYMENTS =
  'Expense amount cannot be less than the sum of recorded payments';

export async function assertExpenseAmountCoversRecordedPayments(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  nextAmount: Decimal,
): Promise<void> {
  const row = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { expensePayments: { select: { amount: true } } },
  });
  if (!row) return;

  const paid = sumExpensePaymentAmounts(row.expensePayments);
  if (nextAmount.lt(paid)) {
    throw new BadRequestException(EXPENSE_AMOUNT_BELOW_PAYMENTS);
  }
}
