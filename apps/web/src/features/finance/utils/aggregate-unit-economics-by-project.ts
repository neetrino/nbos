import type { UnitEconomicsRow } from '@/lib/api/unit-economics';

export type UnitEconomicsProjectRow = {
  projectId: string;
  projectCode: string;
  projectName: string;
  unitCount: number;
  receivedAmount: number;
  receivableAmount: number;
  expensesPaidAmount: number;
  remainingBonuses: number;
  cashBalance: number;
  outCommittedAmount: number;
  marginAfterCommitments: number;
};

function sumField(rows: UnitEconomicsRow[], pick: (r: UnitEconomicsRow) => string): number {
  return rows.reduce((acc, row) => acc + Number.parseFloat(pick(row)), 0);
}

export function aggregateUnitEconomicsByProject(
  items: UnitEconomicsRow[],
): UnitEconomicsProjectRow[] {
  const byProject = new Map<string, UnitEconomicsRow[]>();
  for (const row of items) {
    const list = byProject.get(row.projectId) ?? [];
    list.push(row);
    byProject.set(row.projectId, list);
  }

  return [...byProject.entries()]
    .map(([projectId, rows]) => {
      const head = rows[0];
      if (!head) return null;
      return {
        projectId,
        projectCode: head.projectCode,
        projectName: head.projectName,
        unitCount: rows.length,
        receivedAmount: sumField(rows, (r) => r.receivedAmount),
        receivableAmount: sumField(rows, (r) => r.receivableAmount),
        expensesPaidAmount: sumField(rows, (r) => r.expensesPaidAmount),
        remainingBonuses: sumField(rows, (r) => r.remainingBonuses),
        cashBalance: sumField(rows, (r) => r.cashBalance),
        outCommittedAmount: sumField(rows, (r) => r.outCommittedAmount),
        marginAfterCommitments: sumField(rows, (r) => r.marginAfterCommitments),
      };
    })
    .filter((row): row is UnitEconomicsProjectRow => row != null)
    .sort((a, b) => b.receivedAmount - a.receivedAmount);
}
