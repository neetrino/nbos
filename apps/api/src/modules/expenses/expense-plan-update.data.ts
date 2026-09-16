import { BadRequestException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import {
  requireExpensePlanCategory,
  resolveExpenseFrequency,
} from './expense-mutation-enum-validators';
import { resolveExpenseLinks } from './expense-link-resolve';
import type { UpdateExpensePlanBody } from './expense-plans.types';
import { toExpensePlanAmountDecimal } from './expense-plan-serialize';

type PrismaDb = InstanceType<typeof PrismaClient>;

export async function buildExpensePlanUpdateData(
  prisma: PrismaDb,
  id: string,
  body: UpdateExpensePlanBody,
): Promise<Prisma.ExpensePlanUpdateInput> {
  const data: Prisma.ExpensePlanUpdateInput = {};
  applyExpensePlanScalarUpdates(data, body);
  if (
    body.productId !== undefined ||
    body.credentialId !== undefined ||
    body.clientServiceRecordId !== undefined
  ) {
    await applyExpensePlanLinkUpdates(prisma, id, data, body);
  }
  return data;
}

function applyExpensePlanScalarUpdates(
  data: Prisma.ExpensePlanUpdateInput,
  body: UpdateExpensePlanBody,
): void {
  if (body.name !== undefined) {
    const n = body.name.trim();
    if (!n) throw new BadRequestException('Name cannot be empty');
    data.name = n;
  }
  if (body.category !== undefined) {
    data.category = requireExpensePlanCategory(
      body.category,
    ) as Prisma.ExpensePlanUpdateInput['category'];
  }
  if (body.amount !== undefined) data.amount = toExpensePlanAmountDecimal(body.amount);
  if (body.frequency !== undefined) {
    data.frequency = resolveExpenseFrequency(
      body.frequency,
    ) as Prisma.ExpensePlanUpdateInput['frequency'];
  }
  if (body.nextDueDate !== undefined) {
    data.nextDueDate = body.nextDueDate ? new Date(body.nextDueDate) : null;
  }
  if (body.autoGenerate !== undefined) data.autoGenerate = Boolean(body.autoGenerate);
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
}

async function applyExpensePlanLinkUpdates(
  prisma: PrismaDb,
  id: string,
  data: Prisma.ExpensePlanUpdateInput,
  body: UpdateExpensePlanBody,
): Promise<void> {
  const current = await prisma.expensePlan.findUnique({
    where: { id },
    select: { productId: true, credentialId: true, clientServiceRecordId: true },
  });
  const links = await resolveExpenseLinks(prisma, {
    productId: body.productId !== undefined ? body.productId : current?.productId,
    credentialId: body.credentialId !== undefined ? body.credentialId : current?.credentialId,
    clientServiceRecordId:
      body.clientServiceRecordId !== undefined
        ? body.clientServiceRecordId
        : current?.clientServiceRecordId,
    useClientServiceAsSource: body.clientServiceRecordId !== undefined,
  });
  if (body.productId !== undefined || body.clientServiceRecordId !== undefined) {
    data.product = links.productId ? { connect: { id: links.productId } } : { disconnect: true };
    data.project = links.projectId ? { connect: { id: links.projectId } } : { disconnect: true };
  }
  if (body.credentialId !== undefined || body.clientServiceRecordId !== undefined) {
    data.credential = links.credentialId
      ? { connect: { id: links.credentialId } }
      : { disconnect: true };
  }
  if (body.clientServiceRecordId !== undefined) {
    data.clientServiceRecord = body.clientServiceRecordId?.trim()
      ? { connect: { id: body.clientServiceRecordId.trim() } }
      : { disconnect: true };
  }
}
