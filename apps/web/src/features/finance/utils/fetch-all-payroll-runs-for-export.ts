import { payrollRunsApi } from '@/lib/api/payroll-runs';
import type { PayrollRunListParams, PayrollRunListRow } from '@/lib/api/payroll-runs';

/**
 * Chunk size for export. Must stay ≤ `normalizeListPageSize` max (500) in
 * `apps/api/src/modules/payroll-runs/payroll-runs.service.ts`.
 */
const PAYROLL_RUNS_EXPORT_PAGE_CHUNK_SIZE = 500;

const PAYROLL_RUNS_EXPORT_ROW_HARD_CAP = 20_000;

/**
 * Loads every payroll run row matching the given list filters by paging through `GET /payroll-runs`.
 */
export async function fetchAllPayrollRunsForExport(
  params: Omit<PayrollRunListParams, 'page' | 'pageSize'>,
): Promise<PayrollRunListRow[]> {
  const aggregated: PayrollRunListRow[] = [];
  let page = 1;
  while (aggregated.length < PAYROLL_RUNS_EXPORT_ROW_HARD_CAP) {
    const data = await payrollRunsApi.getAll({
      ...params,
      page,
      pageSize: PAYROLL_RUNS_EXPORT_PAGE_CHUNK_SIZE,
    });
    aggregated.push(...data.items);
    const totalPages = Math.max(1, data.meta.totalPages);
    if (page >= totalPages || data.items.length === 0) {
      break;
    }
    page += 1;
  }
  return aggregated;
}
