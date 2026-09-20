import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type Db = InstanceType<typeof PrismaClient>;

const RUNTIME_SETTING_ID = 'default';

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
