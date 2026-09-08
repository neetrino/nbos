import { BadRequestException } from '@nestjs/common';

export type ExpenseOwnershipInput = {
  productId?: string | null;
  expensePlanId?: string | null;
  clientServiceRecordId?: string | null;
};

export type ExpenseOwnership = {
  productId: string | null;
  projectId: string | null;
};

type ExpenseOwnershipDb = {
  product: {
    findUnique: (args: {
      where: { id: string };
      select: { projectId: true };
    }) => Promise<{ projectId: string } | null>;
  };
  expensePlan: {
    findUnique: (args: {
      where: { id: string };
      select: { productId: true };
    }) => Promise<{ productId: string | null } | null>;
  };
  clientServiceRecord: {
    findUnique: (args: {
      where: { id: string };
      select: { productId: true };
    }) => Promise<{ productId: string | null } | null>;
  };
};

const PRODUCT_CONFLICT = 'Expense product does not match the linked source product.';

function trimId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function uniqueIds(ids: Array<string | null>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

async function sourceProductIds(
  prisma: ExpenseOwnershipDb,
  input: ExpenseOwnershipInput,
): Promise<string[]> {
  const [plan, service] = await Promise.all([
    input.expensePlanId
      ? prisma.expensePlan.findUnique({
          where: { id: input.expensePlanId },
          select: { productId: true },
        })
      : null,
    input.clientServiceRecordId
      ? prisma.clientServiceRecord.findUnique({
          where: { id: input.clientServiceRecordId },
          select: { productId: true },
        })
      : null,
  ]);

  return uniqueIds([plan?.productId ?? null, service?.productId ?? null]);
}

/** Resolves Expense/Plan productId and denormalized projectId from Product. */
export async function resolveExpenseProductOwnership(
  prisma: ExpenseOwnershipDb,
  input: ExpenseOwnershipInput,
): Promise<ExpenseOwnership> {
  const explicit = trimId(input.productId);
  const fromSources = await sourceProductIds(prisma, input);
  const candidates = uniqueIds([explicit, ...fromSources]);

  if (candidates.length > 1) {
    throw new BadRequestException(PRODUCT_CONFLICT);
  }

  const productId = candidates[0] ?? null;
  if (!productId) return { productId: null, projectId: null };

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { projectId: true },
  });
  if (!product) {
    throw new BadRequestException('Product not found');
  }

  return { productId, projectId: product.projectId };
}
