import type { TransactionClient } from '@nbos/database';
import { allocateShares } from '@nbos/shared';

type RestorableFeature = {
  id: string;
  functionId: string;
  origin: string;
  archivedAt: Date | null;
};

export async function restoreArchivedFeature(
  db: TransactionClient,
  input: {
    features: RestorableFeature[];
    functionId: string;
    afterPlan: boolean;
  },
): Promise<boolean> {
  const archived = input.features.find(
    (feature) => feature.functionId === input.functionId && feature.archivedAt,
  );
  if (!archived) {
    return false;
  }
  await db.deliveryConfigurationFeature.update({
    where: { id: archived.id },
    data: { archivedAt: null },
  });
  if (input.afterPlan && archived.origin === 'EXTRA') {
    await restoreUnpaidRemainder(db, archived.id);
  }
  return true;
}

async function restoreUnpaidRemainder(db: TransactionClient, featureId: string): Promise<void> {
  const feature = await db.deliveryConfigurationFeature.findUnique({
    where: { id: featureId },
    include: { components: { include: { allocations: { include: { bonusEntry: true } } } } },
  });
  if (!feature) {
    return;
  }
  for (const component of feature.components) {
    if (component.allocations.length === 0) {
      continue;
    }
    const restored = allocateShares(
      component.amount.toString(),
      component.allocations.map((row) => ({
        key: row.id,
        percent: row.sharePercent.toString(),
      })),
    );
    for (const share of restored) {
      const allocation = component.allocations.find((row) => row.id === share.key);
      if (!allocation) continue;
      await db.deliveryBonusAllocation.update({
        where: { id: allocation.id },
        data: { currentPlannedAmount: share.amount },
      });
      if (allocation.bonusEntry) {
        await db.bonusEntry.update({
          where: { id: allocation.bonusEntry.id },
          data: { amount: share.amount, payableAmount: share.amount, percent: 0 },
        });
      }
    }
  }
}
