import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { buildExpenseParticipationWhere } from '../finance/finance-module-participation.where';
import {
  financeScopedBypassRowFilter,
  loadFinanceScopedEmployeeIds,
  type FinanceScopedAccessContext,
} from '../finance/finance-scoped-access';

/** Ensures the viewer may read or mutate an expense (404 when denied). */
export async function assertExpenseAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  expenseId: string,
  access: FinanceScopedAccessContext | undefined,
): Promise<void> {
  if (!access || financeScopedBypassRowFilter(access.viewScope)) return;

  const scopedIds = await loadFinanceScopedEmployeeIds(prisma, access);
  const operational = buildExpenseParticipationWhere(
    scopedIds,
    Boolean(access.dealScopedParticipation),
  );

  const row = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      OR: [{ salaryLine: { isNot: null } }, operational],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException(`Expense ${expenseId} not found`);
  }
}
