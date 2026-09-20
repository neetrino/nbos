import { NotFoundException } from '@nestjs/common';
import type { TransactionClient } from '@nbos/database';

export async function lockDeliveryConfigurationRow(
  db: Pick<TransactionClient, '$queryRaw'>,
  configurationId: string,
): Promise<void> {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM delivery_configurations WHERE id = ${configurationId} FOR UPDATE
  `;
  if (rows.length === 0) {
    throw new NotFoundException('Configuration not found');
  }
}

/**
 * Takes the same row lock from the lifecycle side, so closing a delivery and changing its scope
 * or its money cannot interleave. A legacy card without a configuration is a no-op.
 */
export async function lockDeliveryConfigurationForProduct(
  db: Pick<TransactionClient, '$queryRaw'>,
  productId: string,
): Promise<void> {
  await db.$queryRaw`
    SELECT id FROM delivery_configurations WHERE product_id = ${productId} FOR UPDATE
  `;
}

export async function lockDeliveryConfigurationForExtension(
  db: Pick<TransactionClient, '$queryRaw'>,
  extensionId: string,
): Promise<void> {
  await db.$queryRaw`
    SELECT id FROM delivery_configurations WHERE extension_id = ${extensionId} FOR UPDATE
  `;
}
