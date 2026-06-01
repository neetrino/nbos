import { Decimal, PrismaClient, type PayrollRunStatusEnum, type Prisma } from '@nbos/database';

/** Stable UI / reporting order for payroll run status breakdown rows. */
const PAYROLL_RUN_STATUS_STATS_ORDER: readonly PayrollRunStatusEnum[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
  'CLOSED',
];

function decimalSumToString(value: Decimal | null | undefined): string {
  if (value == null) {
    return '0.00';
  }
  return value.toFixed(2);
}

/** Run-level payable minus paid across the filtered scope (Decimal-safe). */
function decimalRemainingString(
  totalPayable: Decimal | null | undefined,
  totalPaid: Decimal | null | undefined,
): string {
  const payable = totalPayable ?? new Decimal(0);
  const paid = totalPaid ?? new Decimal(0);
  return payable.minus(paid).toFixed(2);
}

export interface PayrollRunStatsResult {
  runCount: number;
  totals: {
    totalBaseSalary: string;
    totalBonuses: string;
    totalPayable: string;
    totalPaid: string;
    /** Sum of (run.totalPayable − run.totalPaid) for runs in scope. */
    totalRemaining: string;
  };
  byStatus: Array<{
    status: PayrollRunStatusEnum;
    runCount: number;
    totalPayable: string;
    totalPaid: string;
    totalRemaining: string;
  }>;
}

export async function computePayrollRunListStats(
  prisma: InstanceType<typeof PrismaClient>,
  where: Prisma.PayrollRunWhereInput,
): Promise<PayrollRunStatsResult> {
  const [runCount, sums, byStatus] = await Promise.all([
    prisma.payrollRun.count({ where }),
    prisma.payrollRun.aggregate({
      where,
      _sum: {
        totalBaseSalary: true,
        totalBonuses: true,
        totalPayable: true,
        totalPaid: true,
      },
    }),
    prisma.payrollRun.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { totalPayable: true, totalPaid: true },
    }),
  ]);

  const s = sums._sum;
  return {
    runCount,
    totals: {
      totalBaseSalary: decimalSumToString(s.totalBaseSalary),
      totalBonuses: decimalSumToString(s.totalBonuses),
      totalPayable: decimalSumToString(s.totalPayable),
      totalPaid: decimalSumToString(s.totalPaid),
      totalRemaining: decimalRemainingString(s.totalPayable, s.totalPaid),
    },
    byStatus: byStatus
      .map((row) => ({
        status: row.status,
        runCount: row._count,
        totalPayable: decimalSumToString(row._sum.totalPayable),
        totalPaid: decimalSumToString(row._sum.totalPaid),
        totalRemaining: decimalRemainingString(row._sum.totalPayable, row._sum.totalPaid),
      }))
      .sort(
        (a, b) =>
          PAYROLL_RUN_STATUS_STATS_ORDER.indexOf(a.status) -
          PAYROLL_RUN_STATUS_STATS_ORDER.indexOf(b.status),
      ),
  };
}
