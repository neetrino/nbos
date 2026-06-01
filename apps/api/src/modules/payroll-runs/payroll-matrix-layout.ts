import type { PayrollMatrixViewModeEnum, PrismaClient } from '@nbos/database';

export type MatrixLayoutRecord = {
  rowOrder: string[];
  columnOrder: string[];
  pinnedUnitIds: string[];
};

function parseIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

export async function loadPayrollMatrixLayout(
  prisma: InstanceType<typeof PrismaClient>,
  userId: string,
  payrollRunId: string,
  viewMode: PayrollMatrixViewModeEnum,
): Promise<MatrixLayoutRecord> {
  const row = await prisma.payrollMatrixLayoutPreference.findUnique({
    where: { userId_payrollRunId_viewMode: { userId, payrollRunId, viewMode } },
  });
  if (!row) {
    return { rowOrder: [], columnOrder: [], pinnedUnitIds: [] };
  }
  return {
    rowOrder: parseIdArray(row.rowOrder),
    columnOrder: parseIdArray(row.columnOrder),
    pinnedUnitIds: parseIdArray(row.pinnedUnitIds),
  };
}

export async function savePayrollMatrixLayout(
  prisma: InstanceType<typeof PrismaClient>,
  userId: string,
  payrollRunId: string,
  viewMode: PayrollMatrixViewModeEnum,
  patch: Partial<MatrixLayoutRecord>,
): Promise<MatrixLayoutRecord> {
  const current = await loadPayrollMatrixLayout(prisma, userId, payrollRunId, viewMode);
  const next: MatrixLayoutRecord = {
    rowOrder: patch.rowOrder ?? current.rowOrder,
    columnOrder: patch.columnOrder ?? current.columnOrder,
    pinnedUnitIds: patch.pinnedUnitIds ?? current.pinnedUnitIds,
  };
  await prisma.payrollMatrixLayoutPreference.upsert({
    where: { userId_payrollRunId_viewMode: { userId, payrollRunId, viewMode } },
    create: {
      userId,
      payrollRunId,
      viewMode,
      rowOrder: next.rowOrder,
      columnOrder: next.columnOrder,
      pinnedUnitIds: next.pinnedUnitIds,
    },
    update: {
      rowOrder: next.rowOrder,
      columnOrder: next.columnOrder,
      pinnedUnitIds: next.pinnedUnitIds,
    },
  });
  return next;
}

/** Apply custom order; unknown ids append in default order. */
export function applyCustomOrder<T extends { id: string }>(items: T[], customOrder: string[]): T[] {
  if (customOrder.length === 0) return items;
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered: T[] = [];
  for (const id of customOrder) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      byId.delete(id);
    }
  }
  for (const rest of byId.values()) {
    ordered.push(rest);
  }
  return ordered;
}
