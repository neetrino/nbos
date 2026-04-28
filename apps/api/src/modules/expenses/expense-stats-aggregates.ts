import { PrismaClient, type Prisma } from '@nbos/database';

/**
 * Runs grouped and aggregate queries for expense statistics with a shared scope.
 */
export async function fetchExpenseStatsAggregates(
  prisma: InstanceType<typeof PrismaClient>,
  scopeWhere: Prisma.ExpenseWhereInput,
) {
  const hasScope = Object.keys(scopeWhere).length > 0;

  const [byCategory, byStatus, totalAmount, paidAmount, unpaidAmount] = await Promise.all([
    prisma.expense.groupBy({
      by: ['category'],
      ...(hasScope ? { where: scopeWhere } : {}),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['status'],
      ...(hasScope ? { where: scopeWhere } : {}),
      _count: true,
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      ...(hasScope ? { where: scopeWhere } : {}),
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        ...scopeWhere,
        status: 'PAID',
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        ...scopeWhere,
        status: { not: 'PAID' },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    byCategory,
    byStatus,
    totalAmount: totalAmount._sum.amount,
    paidAmount: paidAmount._sum.amount,
    unpaidAmount: unpaidAmount._sum.amount,
  };
}
