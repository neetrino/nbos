import type { BonusProductPoolRow } from '@/lib/api/bonus';

export interface BonusPoolsProjectGroup {
  projectId: string;
  projectCode: string;
  projectName: string;
  pools: BonusProductPoolRow[];
}

export function groupBonusPoolsByProject(rows: BonusProductPoolRow[]): BonusPoolsProjectGroup[] {
  const byProject = new Map<string, BonusPoolsProjectGroup>();
  for (const row of rows) {
    const existing = byProject.get(row.projectId);
    if (existing) {
      existing.pools.push(row);
      continue;
    }
    byProject.set(row.projectId, {
      projectId: row.projectId,
      projectCode: row.projectCode,
      projectName: row.projectName,
      pools: [row],
    });
  }
  return [...byProject.values()]
    .map((group) => ({
      ...group,
      pools: [...group.pools].sort((a, b) => a.poolName.localeCompare(b.poolName)),
    }))
    .sort((a, b) => a.projectCode.localeCompare(b.projectCode));
}
