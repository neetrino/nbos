import type { DeliveryStageEnum, PrismaClient } from '@nbos/database';

export type ChecklistStageProgressSummary = {
  completed: number;
  total: number;
  completedChecklists: number;
  totalChecklists: number;
};

export function summarizeChecklistSnapshotProgress(
  snapshotItems: unknown,
): ChecklistStageProgressSummary {
  if (!Array.isArray(snapshotItems) || snapshotItems.length === 0) {
    return { completed: 0, total: 0, completedChecklists: 0, totalChecklists: 0 };
  }
  const total = snapshotItems.length;
  let completed = 0;
  for (const row of snapshotItems) {
    if (!row || typeof row !== 'object') continue;
    const mark = (row as Record<string, unknown>).mark;
    if (mark === 'DONE' || mark === 'NOT_DONE') {
      completed += 1;
    }
  }
  return { completed, total, completedChecklists: 0, totalChecklists: 0 };
}

type OwnerStage = {
  ownerEntityType: 'PRODUCT' | 'EXTENSION';
  ownerEntityId: string;
  stage: DeliveryStageEnum | null;
};

function progressKey(ownerEntityType: string, ownerEntityId: string, stage: string) {
  return `${ownerEntityType}:${ownerEntityId}:${stage}`;
}

function mergeProgress(
  target: Map<string, ChecklistStageProgressSummary>,
  key: string,
  next: ChecklistStageProgressSummary,
) {
  const prev = target.get(key);
  if (!prev) {
    target.set(key, next);
    return;
  }
  target.set(key, {
    total: prev.total + next.total,
    completed: prev.completed + next.completed,
    completedChecklists: prev.completedChecklists + next.completedChecklists,
    totalChecklists: prev.totalChecklists + next.totalChecklists,
  });
}

/**
 * Loads checklist instances for listed owners (any stage rows) and aggregates progress per owner+stage.
 */
export async function loadStageChecklistProgressByOwner(
  prisma: InstanceType<typeof PrismaClient>,
  entries: OwnerStage[],
): Promise<Map<string, ChecklistStageProgressSummary>> {
  const map = new Map<string, ChecklistStageProgressSummary>();
  const productIds = [
    ...new Set(
      entries
        .filter((e) => e.ownerEntityType === 'PRODUCT' && e.stage != null)
        .map((e) => e.ownerEntityId),
    ),
  ];
  const extensionIds = [
    ...new Set(
      entries
        .filter((e) => e.ownerEntityType === 'EXTENSION' && e.stage != null)
        .map((e) => e.ownerEntityId),
    ),
  ];

  const [productInst, extInst] = await Promise.all([
    productIds.length
      ? prisma.checklistInstance.findMany({
          where: {
            ownerEntityType: 'PRODUCT',
            ownerEntityId: { in: productIds },
            deliveryStage: { not: null },
          },
          select: {
            ownerEntityId: true,
            deliveryStage: true,
            snapshotItems: true,
            completedAt: true,
          },
        })
      : Promise.resolve([]),
    extensionIds.length
      ? prisma.checklistInstance.findMany({
          where: {
            ownerEntityType: 'EXTENSION',
            ownerEntityId: { in: extensionIds },
            deliveryStage: { not: null },
          },
          select: {
            ownerEntityId: true,
            deliveryStage: true,
            snapshotItems: true,
            completedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  for (const row of productInst) {
    if (!row.deliveryStage) continue;
    const k = progressKey('PRODUCT', row.ownerEntityId, row.deliveryStage);
    mergeProgress(
      map,
      k,
      withChecklistCompletion(
        summarizeChecklistSnapshotProgress(row.snapshotItems),
        row.completedAt,
      ),
    );
  }
  for (const row of extInst) {
    if (!row.deliveryStage) continue;
    const k = progressKey('EXTENSION', row.ownerEntityId, row.deliveryStage);
    mergeProgress(
      map,
      k,
      withChecklistCompletion(
        summarizeChecklistSnapshotProgress(row.snapshotItems),
        row.completedAt,
      ),
    );
  }

  return map;
}

function withChecklistCompletion(
  summary: ChecklistStageProgressSummary,
  completedAt: Date | string | null,
): ChecklistStageProgressSummary {
  return {
    ...summary,
    totalChecklists: 1,
    completedChecklists: completedAt ? 1 : 0,
  };
}

export function pickProgressForEntity(
  progressMap: Map<string, ChecklistStageProgressSummary>,
  ownerEntityType: 'PRODUCT' | 'EXTENSION',
  ownerEntityId: string,
  stage: DeliveryStageEnum | null,
): ChecklistStageProgressSummary | null {
  if (!stage) return null;
  return progressMap.get(progressKey(ownerEntityType, ownerEntityId, stage)) ?? null;
}
