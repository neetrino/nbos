import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ExpensePlanStatusEnum } from '@nbos/database';

/** Same copy as plan `generateCard` when the plan is stopped. */
export const EXPENSE_PLAN_INACTIVE_LINK = 'Resume the expense plan before generating a card.';

type ExpensePlanLinkDb = {
  expensePlan: {
    findUnique: (args: {
      where: { id: string };
      select: { status: true };
    }) => Promise<{ status: ExpensePlanStatusEnum } | null>;
  };
};

/**
 * Manual cards may link to an ACTIVE plan only. Cancelled plans stay read-only.
 */
export async function assertExpensePlanLinkable(
  prisma: ExpensePlanLinkDb,
  expensePlanId: string | null | undefined,
): Promise<void> {
  const id = expensePlanId?.trim();
  if (!id) return;

  const plan = await prisma.expensePlan.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!plan) {
    throw new NotFoundException('Expense plan not found');
  }
  if (plan.status === 'CANCELLED') {
    throw new BadRequestException(EXPENSE_PLAN_INACTIVE_LINK);
  }
}
