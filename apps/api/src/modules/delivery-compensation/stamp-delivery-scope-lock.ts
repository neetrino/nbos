import type { PrismaClient } from '@nbos/database';

type Db = Pick<InstanceType<typeof PrismaClient>, 'deliveryConfiguration'>;

/**
 * Freezes scope and money at the first close of a delivery. A card may later be reopened so a
 * defect can be fixed, but the configurator never reopens with it: the fix is either unpaid
 * warranty work or a new Extension with its own plan. The stamp is written once and never moved,
 * so a second close cannot re-date the freeze.
 */
export async function stampDeliveryScopeLockForProduct(db: Db, productId: string): Promise<number> {
  return stampScopeLock(db, { productId });
}

export async function stampDeliveryScopeLockForExtension(
  db: Db,
  extensionId: string,
): Promise<number> {
  return stampScopeLock(db, { extensionId });
}

async function stampScopeLock(
  db: Db,
  target: { productId: string } | { extensionId: string },
): Promise<number> {
  const result = await db.deliveryConfiguration.updateMany({
    where: { ...target, scopeLockedAt: null },
    data: { scopeLockedAt: new Date() },
  });
  return result.count;
}
