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
