import { BadRequestException } from '@nestjs/common';

export type InvoiceOwnershipInput = {
  productId?: string | null;
  orderId?: string | null;
  subscriptionId?: string | null;
  clientServiceRecordId?: string | null;
};

export type InvoiceOwnership = {
  productId: string | null;
  projectId: string | null;
};

type InvoiceOwnershipDb = {
  product: {
    findUnique: (args: {
      where: { id: string };
      select: { projectId: true };
    }) => Promise<{ projectId: string } | null>;
  };
  order: {
    findUnique: (args: {
      where: { id: string };
      select: { productId: true; extension: { select: { productId: true } } };
    }) => Promise<{
      productId: string | null;
      extension: { productId: string } | null;
    } | null>;
  };
  subscription: {
    findUnique: (args: {
      where: { id: string };
      select: { productId: true };
    }) => Promise<{ productId: string } | null>;
  };
  clientServiceRecord: {
    findUnique: (args: {
      where: { id: string };
      select: { productId: true };
    }) => Promise<{ productId: string | null } | null>;
  };
};

const PRODUCT_CONFLICT = 'Invoice product does not match the linked source product.';
const PRODUCT_MISSING = 'A product is required to create this invoice.';

function trimId(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function uniqueIds(ids: Array<string | null>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

async function sourceProductIds(
  prisma: InvoiceOwnershipDb,
  input: InvoiceOwnershipInput,
): Promise<string[]> {
  const [order, subscription, service] = await Promise.all([
    input.orderId
      ? prisma.order.findUnique({
          where: { id: input.orderId },
          select: { productId: true, extension: { select: { productId: true } } },
        })
      : null,
    input.subscriptionId
      ? prisma.subscription.findUnique({
          where: { id: input.subscriptionId },
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

  return uniqueIds([
    order?.productId ?? order?.extension?.productId ?? null,
    subscription?.productId ?? null,
    service?.productId ?? null,
  ]);
}

/** Resolves Invoice.productId and denormalized projectId from Product. */
export async function resolveInvoiceProductOwnership(
  prisma: InvoiceOwnershipDb,
  input: InvoiceOwnershipInput,
): Promise<InvoiceOwnership> {
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

export function requireInvoiceProductId(productId: string | null): string {
  if (!productId) {
    throw new BadRequestException(PRODUCT_MISSING);
  }
  return productId;
}
