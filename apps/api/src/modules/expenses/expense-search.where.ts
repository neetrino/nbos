import type { Prisma } from '@nbos/database';

/** Expense text search AND clause shared by expense list and global search. */
export function buildExpenseSearchAnd(searchTrimmed: string): Prisma.ExpenseWhereInput {
  const ic = { contains: searchTrimmed, mode: 'insensitive' as const };
  return {
    OR: [
      { name: ic },
      { notes: ic },
      { project: { name: ic } },
      { project: { code: ic } },
      { expensePlan: { name: ic } },
      { expensePlan: { provider: ic } },
    ],
  };
}
