import type { UnitEconomicsProjectRollup, UnitEconomicsRow } from '@/lib/api/unit-economics';

export type UnitEconomicsTreeProduct = {
  key: string;
  productGroupId: string;
  label: string;
  unitCount: number;
  orders: UnitEconomicsRow[];
  receivedAmount: string;
  receivableAmount: string;
  expensesPaidAmount: string;
  remainingBonuses: string;
  cashBalance: string;
  outCommittedAmount: string;
  marginAfterCommitments: string;
};

export type UnitEconomicsTreeProject = UnitEconomicsProjectRollup & {
  key: string;
  products: UnitEconomicsTreeProduct[];
};

function sumMoney(rows: UnitEconomicsRow[], pick: (r: UnitEconomicsRow) => string): string {
  const total = rows.reduce((acc, row) => acc + Number.parseFloat(pick(row)), 0);
  return total.toFixed(2);
}

function productKey(row: UnitEconomicsRow): string {
  const groupId = row.productGroupId ?? row.orderId;
  return `${row.projectId}:product:${groupId}`;
}

/** Builds Project → Product (incl. extensions) → Order hierarchy for nested UE view. */
export function buildUnitEconomicsTree(
  items: UnitEconomicsRow[],
  projects: UnitEconomicsProjectRollup[],
): UnitEconomicsTreeProject[] {
  const itemsByProject = new Map<string, UnitEconomicsRow[]>();
  for (const row of items) {
    const list = itemsByProject.get(row.projectId) ?? [];
    list.push(row);
    itemsByProject.set(row.projectId, list);
  }

  return projects.map((project) => {
    const projectRows = itemsByProject.get(project.projectId) ?? [];
    const byProduct = new Map<string, UnitEconomicsRow[]>();
    for (const row of projectRows) {
      const key = productKey(row);
      const list = byProduct.get(key) ?? [];
      list.push(row);
      byProduct.set(key, list);
    }

    const products = [...byProduct.entries()]
      .map(([key, orders]) => {
        const head = orders[0];
        if (!head) return null;
        const sorted = [...orders].sort((a, b) => a.orderCode.localeCompare(b.orderCode));
        return {
          key,
          productGroupId: head.productGroupId ?? head.orderId,
          label: head.productGroupName,
          unitCount: sorted.length,
          orders: sorted,
          receivedAmount: sumMoney(sorted, (r) => r.receivedAmount),
          receivableAmount: sumMoney(sorted, (r) => r.receivableAmount),
          expensesPaidAmount: sumMoney(sorted, (r) => r.expensesPaidAmount),
          remainingBonuses: sumMoney(sorted, (r) => r.remainingBonuses),
          cashBalance: sumMoney(sorted, (r) => r.cashBalance),
          outCommittedAmount: sumMoney(sorted, (r) => r.outCommittedAmount),
          marginAfterCommitments: sumMoney(sorted, (r) => r.marginAfterCommitments),
        };
      })
      .filter((row): row is UnitEconomicsTreeProduct => row != null)
      .sort((a, b) => Number.parseFloat(b.receivedAmount) - Number.parseFloat(a.receivedAmount));

    return { ...project, key: project.projectId, products };
  });
}
