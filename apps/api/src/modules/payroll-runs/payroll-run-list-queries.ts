import { PrismaClient } from '@nbos/database';
import { buildPayrollRunWhereFromScope } from './payroll-run-list-scope';
import { fetchMaterializedSalaryLineCountByPayrollRunId } from './payroll-run-materialized-line-counts';
import { computePayrollRunListStats, type PayrollRunStatsResult } from './payroll-run-list-stats';
import { omitLegacyPayrollKpiFields } from './payroll-run-api-response';

const LIST_SORT_FIELDS = new Set(['createdAt', 'payrollMonth', 'status']);

function normalizeListPage(page?: number): number {
  const n = page ?? 1;
  return n < 1 ? 1 : n;
}

function normalizeListPageSize(pageSize?: number): number {
  const n = pageSize ?? 20;
  return Math.min(500, Math.max(1, n));
}

export interface PayrollRunListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  /** Inclusive lower bound `YYYY-MM` (string order matches calendar). */
  payrollMonthFrom?: string;
  /** Inclusive upper bound `YYYY-MM`. */
  payrollMonthTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function queryPayrollRunList(
  prisma: InstanceType<typeof PrismaClient>,
  params: PayrollRunListParams,
) {
  const page = normalizeListPage(params.page);
  const pageSize = normalizeListPageSize(params.pageSize);
  const sortBy = params.sortBy && LIST_SORT_FIELDS.has(params.sortBy) ? params.sortBy : 'createdAt';
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';

  const where = buildPayrollRunWhereFromScope({
    status: params.status,
    payrollMonthFrom: params.payrollMonthFrom,
    payrollMonthTo: params.payrollMonthTo,
  });

  const [items, total] = await Promise.all([
    prisma.payrollRun.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { salaryLines: true } },
      },
    }),
    prisma.payrollRun.count({ where }),
  ]);

  const materializedByRun = await fetchMaterializedSalaryLineCountByPayrollRunId(
    prisma,
    items.map((row) => row.id),
  );

  return {
    items: items.map((row) => ({
      ...omitLegacyPayrollKpiFields(row),
      materializedExpenseLineCount: materializedByRun.get(row.id) ?? 0,
    })),
    meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function queryPayrollRunListStats(
  prisma: InstanceType<typeof PrismaClient>,
  params: Pick<PayrollRunListParams, 'status' | 'payrollMonthFrom' | 'payrollMonthTo'>,
): Promise<PayrollRunStatsResult> {
  const where = buildPayrollRunWhereFromScope({
    status: params.status,
    payrollMonthFrom: params.payrollMonthFrom,
    payrollMonthTo: params.payrollMonthTo,
  });
  return computePayrollRunListStats(prisma, where);
}
