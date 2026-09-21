import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

const TERMINAL_DELIVERY_STATUSES = ['DONE', 'LOST'];

type Db = Pick<InstanceType<typeof PrismaClient>, 'deliveryConfiguration'>;

type LockState = { scopeLockedAt: Date | null; status: string | null };

/**
 * Scope and money on a delivery that was closed at least once are history: adding, removing or
 * reassigning lines would rewrite amounts that payroll may already have paid. The `scopeLockedAt`
 * stamp, not the current status, is what decides this — a card reopened to fix a defect is
 * `DEVELOPMENT` again, and a status check would hand its money back to editing.
 */
export async function assertDeliveryOpenForConfiguration(
  db: Db,
  configurationId: string,
): Promise<void> {
  const configuration = await db.deliveryConfiguration.findUnique({
    where: { id: configurationId },
    select: {
      scopeLockedAt: true,
      product: { select: { status: true } },
      extension: { select: { status: true } },
    },
  });
  if (!configuration) {
    throw new NotFoundException(`Delivery configuration ${configurationId} not found`);
  }
  assertOpen({
    scopeLockedAt: configuration.scopeLockedAt,
    status: configuration.product?.status ?? configuration.extension?.status ?? null,
  });
}

/**
 * Same rule reached from the extension side, where a card may not be enrolled yet and therefore
 * carries no configuration row. Such a card has no plan and no money, so only its status matters.
 */
export async function assertDeliveryOpenForExtension(
  db: Db & Pick<InstanceType<typeof PrismaClient>, 'extension'>,
  extensionId: string,
): Promise<void> {
  const configuration = await db.deliveryConfiguration.findFirst({
    where: { extensionId },
    select: { scopeLockedAt: true, extension: { select: { status: true } } },
  });
  if (configuration) {
    assertOpen({
      scopeLockedAt: configuration.scopeLockedAt,
      status: configuration.extension?.status ?? null,
    });
    return;
  }
  const extension = await db.extension.findUnique({
    where: { id: extensionId },
    select: { status: true },
  });
  if (!extension) {
    throw new NotFoundException(`Extension ${extensionId} not found`);
  }
  assertOpen({ scopeLockedAt: null, status: extension.status });
}

function assertOpen({ scopeLockedAt, status }: LockState): void {
  const closedNow = status !== null && TERMINAL_DELIVERY_STATUSES.includes(status);
  if (scopeLockedAt !== null || closedNow) {
    throwDeliveryCompensationError('FINANCIAL_ALLOCATION_LOCKED');
  }
}
