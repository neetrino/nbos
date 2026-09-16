import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, PrismaClient } from '@nbos/database';
import { planNextDueAfterOccurrence } from './expense-plan-next-due';
import { assertExpensePlanAccessible } from './expense-plan-access.op';
import type { ExpensePlanWriteAccess } from './expense-plans.types';
import type { ExpensesService } from './expenses.service';

type PrismaDb = InstanceType<typeof PrismaClient>;

export async function generateExpenseCardFromPlan(
  prisma: PrismaDb,
  expensesService: ExpensesService,
  planId: string,
  body?: { dueDate?: string | null },
  access?: ExpensePlanWriteAccess,
) {
  await assertExpensePlanAccessible(prisma, planId, access?.plan);
  const plan = await prisma.expensePlan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundException('Expense plan not found');
  if (plan.status === 'CANCELLED') {
    throw new BadRequestException('Resume the expense plan before generating a card.');
  }

  const fromBody = body?.dueDate?.trim() ? new Date(body.dueDate) : null;
  const occurrence = fromBody ?? plan.nextDueDate;
  if (!occurrence) {
    throw new BadRequestException('Set next due on the plan or pass dueDate to generate a card.');
  }

  const expense = await expensesService.create(
    {
      name: plan.name,
      type: 'PLANNED',
      category: plan.category,
      amount: new Decimal(plan.amount).toNumber(),
      frequency: 'ONE_TIME',
      dueDate: occurrence.toISOString(),
      status: 'PLANNED',
      productId: plan.productId,
      credentialId: plan.credentialId,
      notes: 'From expense plan',
      expensePlanId: planId,
      clientServiceRecordId: plan.clientServiceRecordId ?? undefined,
    },
    access?.expense,
  );

  await prisma.expensePlan.update({
    where: { id: planId },
    data: { nextDueDate: planNextDueAfterOccurrence(occurrence, plan.frequency) },
  });

  return expense;
}
