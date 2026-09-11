import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type LockDb = Pick<InstanceType<typeof PrismaClient>, '$queryRaw'>;

/** Serializes coverage checks against concurrent manual (or overlapping) invoice writes. */
export async function lockSubscriptionRow(tx: LockDb, subscriptionId: string): Promise<void> {
  const locked = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM subscriptions WHERE id = ${subscriptionId} FOR UPDATE
  `;
  if (locked.length === 0) {
    throw new NotFoundException(`Subscription ${subscriptionId} not found`);
  }
}
