import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

type Db = InstanceType<typeof PrismaClient>;

type ClosureMarkers = {
  status: string;
  deliveryResolution: string | null;
  closedAt: Date | null;
};

const RUNTIME_SETTING_ID = 'default';

const TERMINAL_DELIVERY_STATUSES = ['DONE', 'LOST'];

/** V2 enrollment stays closed until the Owner turns the readiness switch on. */
export async function assertEnrollmentEnabled(prisma: Db): Promise<void> {
  const setting = await prisma.deliveryCompensationRuntimeSetting.findUnique({
    where: { id: RUNTIME_SETTING_ID },
  });
  if (!setting?.newEnrollmentEnabled) {
    throw new ConflictException('LEGACY_ADOPTION_REQUIRED');
  }
}

/** An order that already carries bonuses belongs to the legacy model and must not be re-enrolled. */
export async function assertOrderHasNoBonusEntries(prisma: Db, orderId: string): Promise<void> {
  const bonusCount = await prisma.bonusEntry.count({ where: { orderId } });
  if (bonusCount > 0) {
    throw new ConflictException('LEGACY_ADOPTION_REQUIRED');
  }
}

/**
 * A finished card does not start the configurator again — canon §7 routes later work to a financial
 * correction or a new Extension. The `scopeLockedAt` stamp cannot carry this case, because a card
 * closed before it was ever enrolled has no configuration row to stamp; the closure markers on the
 * card itself are the only evidence at this point.
 */
export async function assertProductNeverClosed(prisma: Db, productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { status: true, deliveryResolution: true, closedAt: true },
  });
  if (!product) {
    throw new NotFoundException(`Product ${productId} not found`);
  }
  assertNeverClosed(product);
}

export async function assertExtensionNeverClosed(prisma: Db, extensionId: string): Promise<void> {
  const extension = await prisma.extension.findUnique({
    where: { id: extensionId },
    select: { status: true, deliveryResolution: true, closedAt: true },
  });
  if (!extension) {
    throw new NotFoundException(`Extension ${extensionId} not found`);
  }
  assertNeverClosed(extension);
}

/**
 * Three markers, because no single one survives every path: the status is cleared by a reopen,
 * `deliveryResolution` is cleared with it, and `closedAt` is written only by `complete` and
 * `cancel`. Together they cover every close this codebase can perform today, including the
 * off-board product that Deal Won creates already `DONE`.
 */
function assertNeverClosed({ status, deliveryResolution, closedAt }: ClosureMarkers): void {
  const closed =
    TERMINAL_DELIVERY_STATUSES.includes(status) || deliveryResolution !== null || closedAt !== null;
  if (closed) {
    throwDeliveryCompensationError('FINANCIAL_ALLOCATION_LOCKED');
  }
}

export async function assertOrderBelongsToProduct(
  prisma: Db,
  productId: string,
  orderId: string,
): Promise<void> {
  const order = await requireOrder(prisma, orderId, { productId: true });
  if (order.productId !== productId) {
    throw new BadRequestException('ORDER_PRODUCT_MISMATCH');
  }
}

export async function assertOrderBelongsToExtension(
  prisma: Db,
  extensionId: string,
  orderId: string,
): Promise<void> {
  const order = await requireOrder(prisma, orderId, { extensionId: true });
  if (order.extensionId !== extensionId) {
    throw new BadRequestException('ORDER_EXTENSION_MISMATCH');
  }
}

async function requireOrder<T extends { productId?: true; extensionId?: true }>(
  prisma: Db,
  orderId: string,
  select: T,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { productId: true, extensionId: true, ...select },
  });
  if (!order) {
    throw new NotFoundException('Order not found');
  }
  return order;
}
