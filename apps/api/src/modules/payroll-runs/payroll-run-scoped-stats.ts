import { Decimal, PrismaClient, type PayrollRunStatusEnum } from '@nbos/database';
import { buildPayrollRunWhereFromScope } from './payroll-run-list-scope';
import type { PayrollRunListParams } from './payroll-run-list-queries';
import type { PayrollRunStatsResult } from './payroll-run-list-stats';

const STATUS_ORDER: readonly PayrollRunStatusEnum[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
  'CLOSED',
];

function money(value: Decimal | null | undefined): string {
  return (value ?? new Decimal(0)).toFixed(2);
}

export async function queryDepartmentPayrollRunListStats(
  prisma: InstanceType<typeof PrismaClient>,
  params: Pick<PayrollRunListParams, 'status' | 'payrollMonthFrom' | 'payrollMonthTo'>,
  employeeIds: string[],
): Promise<PayrollRunStatsResult> {
  const where = buildPayrollRunWhereFromScope(params);
  const runs = await prisma.payrollRun.findMany({
    where,
    select: { id: true, status: true },
  });
  const runIds = runs.map((run) => run.id);
  if (runIds.length === 0 || employeeIds.length === 0) {
    return emptyPayrollStats();
  }

  const [totals, byRun] = await Promise.all([
    prisma.salaryLine.aggregate({
      where: { payrollRunId: { in: runIds }, employeeId: { in: employeeIds } },
      _sum: {
        baseSalary: true,
        bonusesTotal: true,
        totalPayable: true,
        paidAmount: true,
      },
    }),
    prisma.salaryLine.groupBy({
      by: ['payrollRunId'],
      where: { payrollRunId: { in: runIds }, employeeId: { in: employeeIds } },
      _sum: { totalPayable: true, paidAmount: true },
    }),
  ]);

  return {
    runCount: runs.length,
    totals: {
      totalBaseSalary: money(totals._sum.baseSalary),
      totalBonuses: money(totals._sum.bonusesTotal),
      totalPayable: money(totals._sum.totalPayable),
      totalPaid: money(totals._sum.paidAmount),
      totalRemaining: money(
        (totals._sum.totalPayable ?? new Decimal(0)).minus(
          totals._sum.paidAmount ?? new Decimal(0),
        ),
      ),
    },
    byStatus: rollupStatsByStatus(runs, byRun),
  };
}

function emptyPayrollStats(): PayrollRunStatsResult {
  return {
    runCount: 0,
    totals: {
      totalBaseSalary: '0.00',
      totalBonuses: '0.00',
      totalPayable: '0.00',
      totalPaid: '0.00',
      totalRemaining: '0.00',
    },
    byStatus: [],
  };
}

function rollupStatsByStatus(
  runs: Array<{ id: string; status: PayrollRunStatusEnum }>,
  byRun: Array<{
    payrollRunId: string;
    _sum: { totalPayable: Decimal | null; paidAmount: Decimal | null };
  }>,
): PayrollRunStatsResult['byStatus'] {
  const sums = new Map(byRun.map((row) => [row.payrollRunId, row._sum] as const));
  const buckets = new Map<
    PayrollRunStatusEnum,
    { runCount: number; payable: Decimal; paid: Decimal }
  >();
  for (const run of runs) {
    const line = sums.get(run.id);
    const current = buckets.get(run.status) ?? {
      runCount: 0,
      payable: new Decimal(0),
      paid: new Decimal(0),
    };
    current.runCount += 1;
    current.payable = current.payable.plus(line?.totalPayable ?? 0);
    current.paid = current.paid.plus(line?.paidAmount ?? 0);
    buckets.set(run.status, current);
  }
  return [...buckets.entries()]
    .map(([status, row]) => ({
      status,
      runCount: row.runCount,
      totalPayable: money(row.payable),
      totalPaid: money(row.paid),
      totalRemaining: money(row.payable.minus(row.paid)),
    }))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
}
