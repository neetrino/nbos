import { Decimal, PrismaClient, type PayrollRunStatusEnum, type Prisma } from '@nbos/database';

function decimalSumToString(value: Decimal | null | undefined): string {
  if (value == null) {
    return '0.00';
  }
  return value.toFixed(2);
}

export interface PayrollRunStatsResult {
  runCount: number;
  totals: {
    totalBaseSalary: string;
    totalBonuses: string;
    totalAdjustments: string;
    totalDeductions: string;
    totalPayable: string;
    totalPaid: string;
  };
  byStatus: Array<{
    status: PayrollRunStatusEnum;
    runCount: number;
    totalPayable: string;
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
        totalAdjustments: true,
        totalDeductions: true,
        totalPayable: true,
        totalPaid: true,
      },
    }),
    prisma.payrollRun.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { totalPayable: true },
    }),
  ]);

  const s = sums._sum;
  return {
    runCount,
    totals: {
      totalBaseSalary: decimalSumToString(s.totalBaseSalary),
      totalBonuses: decimalSumToString(s.totalBonuses),
      totalAdjustments: decimalSumToString(s.totalAdjustments),
      totalDeductions: decimalSumToString(s.totalDeductions),
      totalPayable: decimalSumToString(s.totalPayable),
      totalPaid: decimalSumToString(s.totalPaid),
    },
    byStatus: byStatus.map((row) => ({
      status: row.status,
      runCount: row._count,
      totalPayable: decimalSumToString(row._sum.totalPayable),
    })),
  };
}
