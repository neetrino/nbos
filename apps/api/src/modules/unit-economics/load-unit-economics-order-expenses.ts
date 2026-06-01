import type { PrismaClient } from '@nbos/database';

import { decimalFrom } from '../bonus/bonus-pool-decimal';
import type { UnitEconomicsExpenseLineDto } from './unit-economics.types';

const EXPENSE_SOURCE_TYPES = ['EXPENSE_PAYMENT', 'EXPENSE_CARD'] as const;

export async function loadUnitEconomicsOrderExpenses(
  prisma: InstanceType<typeof PrismaClient>,
  orderId: string,
): Promise<UnitEconomicsExpenseLineDto[]> {
  const journalRows = await prisma.operationalJournalEntry.findMany({
    where: {
      orderId,
      status: 'ACTIVE',
      sourceType: { in: [...EXPENSE_SOURCE_TYPES] },
    },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      functionalAmount: true,
      bookedAt: true,
      description: true,
    },
    orderBy: { bookedAt: 'desc' },
  });

  if (journalRows.length === 0) {
    return [];
  }

  const paymentIds = journalRows
    .filter((r) => r.sourceType === 'EXPENSE_PAYMENT')
    .map((r) => r.sourceId);
  const expenseIdsFromCard = journalRows
    .filter((r) => r.sourceType === 'EXPENSE_CARD')
    .map((r) => r.sourceId);

  const [payments, cardExpenses] = await Promise.all([
    paymentIds.length > 0
      ? prisma.expensePayment.findMany({
          where: { id: { in: paymentIds } },
          select: {
            id: true,
            expense: { select: { id: true, name: true } },
          },
        })
      : [],
    expenseIdsFromCard.length > 0
      ? prisma.expense.findMany({
          where: { id: { in: expenseIdsFromCard } },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const paymentExpenseById = new Map(
    payments.map((p) => [p.id, { expenseId: p.expense.id, name: p.expense.name }] as const),
  );
  const cardExpenseById = new Map(cardExpenses.map((e) => [e.id, e.name] as const));

  return journalRows.map((row) => {
    const amount = decimalFrom(row.functionalAmount).abs();
    if (row.sourceType === 'EXPENSE_PAYMENT') {
      const linked = paymentExpenseById.get(row.sourceId);
      return {
        journalEntryId: row.id,
        expenseId: linked?.expenseId ?? row.sourceId,
        name: linked?.name ?? row.description ?? 'Expense payment',
        amount: amount.toFixed(2),
        bookedAt: row.bookedAt.toISOString(),
        sourceType: row.sourceType,
      };
    }
    const name = cardExpenseById.get(row.sourceId) ?? row.description ?? 'Expense';
    return {
      journalEntryId: row.id,
      expenseId: row.sourceId,
      name,
      amount: amount.toFixed(2),
      bookedAt: row.bookedAt.toISOString(),
      sourceType: row.sourceType,
    };
  });
}
