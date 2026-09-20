import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { throwDeliveryCompensationError } from './delivery-compensation-http-error';

const TERMINAL_DELIVERY_STATUSES = ['DONE', 'LOST'];

type Db = Pick<InstanceType<typeof PrismaClient>, 'deliveryConfiguration'>;

/**
 * Scope and money on a closed delivery are history. Once the product or extension is Done or
 * cancelled, adding, removing or reassigning lines would rewrite amounts that payroll may already
 * have paid, so the configuration is read-only from that point.
 */
export async function assertDeliveryOpenForConfiguration(
  db: Db,
  configurationId: string,
): Promise<void> {
  const configuration = await db.deliveryConfiguration.findUnique({
    where: { id: configurationId },
    select: {
      product: { select: { status: true } },
      extension: { select: { status: true } },
    },
  });
  if (!configuration) {
    throw new NotFoundException(`Delivery configuration ${configurationId} not found`);
  }
  assertStatusOpen(configuration.product?.status ?? configuration.extension?.status ?? null);
}

export async function assertDeliveryOpenForExtension(
  db: Pick<InstanceType<typeof PrismaClient>, 'extension'>,
  extensionId: string,
): Promise<void> {
  const extension = await db.extension.findUnique({
    where: { id: extensionId },
    select: { status: true },
  });
  if (!extension) {
    throw new NotFoundException(`Extension ${extensionId} not found`);
  }
  assertStatusOpen(extension.status);
}

function assertStatusOpen(status: string | null): void {
  if (status !== null && TERMINAL_DELIVERY_STATUSES.includes(status)) {
    throwDeliveryCompensationError('FINANCIAL_ALLOCATION_LOCKED');
  }
}
