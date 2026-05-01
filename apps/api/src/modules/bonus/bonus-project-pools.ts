import { Decimal, type BonusStatusEnum } from '@nbos/database';

/** One cell from `bonusEntry.groupBy({ by: ['projectId', 'status'] })`. */
export interface BonusProjectPoolGroupRow {
  projectId: string;
  status: BonusStatusEnum;
  _sum: { amount: Decimal | null };
  _count: number;
}

/** Serialized project bonus roll-up for Finance / reporting (no separate pool table). */
export interface BonusProjectPoolRow {
  projectId: string;
  projectCode: string;
  projectName: string;
  entryCount: number;
  sumTotalAmount: string;
  sumPipelineAmount: string;
  sumPaidAmount: string;
  sumClawbackAmount: string;
}

const ZERO = new Decimal(0);

function toMoneyString(value: Decimal): string {
  return value.toFixed(2);
}

function decimalFrom(value: Decimal | number | string | null | undefined): Decimal {
  if (value == null) return ZERO;
  if (value instanceof Decimal) return value;
  return new Decimal(value);
}

function addDecimal(a: Decimal, b: Decimal | number | string | null | undefined): Decimal {
  return a.plus(decimalFrom(b));
}

type PoolAcc = {
  entryCount: number;
  pipeline: Decimal;
  paid: Decimal;
  clawback: Decimal;
};

function emptyAcc(): PoolAcc {
  return { entryCount: 0, pipeline: ZERO, paid: ZERO, clawback: ZERO };
}

function mergeRow(acc: PoolAcc, row: BonusProjectPoolGroupRow): PoolAcc {
  const amount = row._sum.amount;
  const nextCount = acc.entryCount + row._count;
  if (row.status === 'PAID') {
    return {
      entryCount: nextCount,
      pipeline: acc.pipeline,
      paid: addDecimal(acc.paid, amount),
      clawback: acc.clawback,
    };
  }
  if (row.status === 'CLAWBACK') {
    return {
      entryCount: nextCount,
      pipeline: acc.pipeline,
      paid: acc.paid,
      clawback: addDecimal(acc.clawback, amount),
    };
  }
  return {
    entryCount: nextCount,
    pipeline: addDecimal(acc.pipeline, amount),
    paid: acc.paid,
    clawback: acc.clawback,
  };
}

function accumulateByProject(groupRows: readonly BonusProjectPoolGroupRow[]): Map<string, PoolAcc> {
  const byProject = new Map<string, PoolAcc>();
  for (const row of groupRows) {
    const prev = byProject.get(row.projectId) ?? emptyAcc();
    byProject.set(row.projectId, mergeRow(prev, row));
  }
  return byProject;
}

function toRows(
  byProject: Map<string, PoolAcc>,
  projectMeta: ReadonlyMap<string, { id: string; code: string; name: string }>,
): BonusProjectPoolRow[] {
  const result: BonusProjectPoolRow[] = [];
  for (const [projectId, acc] of byProject) {
    const meta = projectMeta.get(projectId);
    const sumTotal = acc.pipeline.plus(acc.paid).plus(acc.clawback);
    result.push({
      projectId,
      projectCode: meta?.code ?? '—',
      projectName: meta?.name ?? 'Unknown project',
      entryCount: acc.entryCount,
      sumTotalAmount: toMoneyString(sumTotal),
      sumPipelineAmount: toMoneyString(acc.pipeline),
      sumPaidAmount: toMoneyString(acc.paid),
      sumClawbackAmount: toMoneyString(acc.clawback),
    });
  }
  result.sort((a, b) => {
    const diff = Number.parseFloat(b.sumTotalAmount) - Number.parseFloat(a.sumTotalAmount);
    if (diff !== 0) return diff;
    return a.projectCode.localeCompare(b.projectCode);
  });
  return result;
}

/**
 * Builds read-only per-project bonus roll-ups from `groupBy(projectId, status)` rows.
 * Pipeline = all statuses other than PAID and CLAWBACK (aligned with wallet-style pipeline).
 */
export function foldBonusProjectPools(
  groupRows: readonly BonusProjectPoolGroupRow[],
  projects: readonly { id: string; code: string; name: string }[],
): BonusProjectPoolRow[] {
  const byProject = accumulateByProject(groupRows);
  const projectMeta = new Map(projects.map((p) => [p.id, p] as const));
  return toRows(byProject, projectMeta);
}
