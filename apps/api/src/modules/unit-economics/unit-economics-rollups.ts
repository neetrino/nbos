import type {
  UnitEconomicsProjectRollupDto,
  UnitEconomicsProductRollupDto,
  UnitEconomicsRowDto,
} from './unit-economics.types';

export type { UnitEconomicsProjectRollupDto, UnitEconomicsProductRollupDto };

function sumMoney(rows: UnitEconomicsRowDto[], pick: (r: UnitEconomicsRowDto) => string): string {
  const total = rows.reduce((acc, row) => acc + Number.parseFloat(pick(row)), 0);
  return total.toFixed(2);
}

export function rollupUnitEconomicsByProject(
  items: UnitEconomicsRowDto[],
): UnitEconomicsProjectRollupDto[] {
  const byProject = new Map<string, UnitEconomicsRowDto[]>();
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
        receivedAmount: sumMoney(rows, (r) => r.receivedAmount),
        receivableAmount: sumMoney(rows, (r) => r.receivableAmount),
        expensesPaidAmount: sumMoney(rows, (r) => r.expensesPaidAmount),
        remainingBonuses: sumMoney(rows, (r) => r.remainingBonuses),
        cashBalance: sumMoney(rows, (r) => r.cashBalance),
        outCommittedAmount: sumMoney(rows, (r) => r.outCommittedAmount),
        marginAfterCommitments: sumMoney(rows, (r) => r.marginAfterCommitments),
      };
    })
    .filter((row): row is UnitEconomicsProjectRollupDto => row != null)
    .sort((a, b) => Number.parseFloat(b.receivedAmount) - Number.parseFloat(a.receivedAmount));
}

function productRollupKey(row: UnitEconomicsRowDto): string {
  const groupId = row.productGroupId ?? row.orderId;
  return `${row.projectId}:product:${groupId}`;
}

export function rollupUnitEconomicsByProduct(
  items: UnitEconomicsRowDto[],
): UnitEconomicsProductRollupDto[] {
  const groups = new Map<string, UnitEconomicsRowDto[]>();
  for (const row of items) {
    const key = productRollupKey(row);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([rollupKey, rows]) => {
      const head = rows[0];
      if (!head) return null;
      const hasProductOrder = rows.some((row) => row.orderType === 'PRODUCT');
      const kind = hasProductOrder ? 'PRODUCT' : head.extensionId ? 'EXTENSION' : 'ORDER';
      return {
        rollupKey,
        kind,
        label: head.productGroupName,
        projectId: head.projectId,
        projectCode: head.projectCode,
        unitCount: rows.length,
        receivedAmount: sumMoney(rows, (r) => r.receivedAmount),
        receivableAmount: sumMoney(rows, (r) => r.receivableAmount),
        expensesPaidAmount: sumMoney(rows, (r) => r.expensesPaidAmount),
        remainingBonuses: sumMoney(rows, (r) => r.remainingBonuses),
        cashBalance: sumMoney(rows, (r) => r.cashBalance),
        outCommittedAmount: sumMoney(rows, (r) => r.outCommittedAmount),
        marginAfterCommitments: sumMoney(rows, (r) => r.marginAfterCommitments),
      };
    })
    .filter((row): row is UnitEconomicsProductRollupDto => row != null)
    .sort((a, b) => Number.parseFloat(b.receivedAmount) - Number.parseFloat(a.receivedAmount));
}
