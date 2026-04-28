import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

/** Must match `GET /payroll-runs?status=` (PayrollRunsController). */
export const PAYROLL_RUNS_LIST_STATUS_QUERY = 'status' as const;

const PAYROLL_RUN_STATUSES: readonly PayrollRunStatus[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
  'CLOSED',
];

export function parsePayrollRunsListStatusParam(raw: string | null): PayrollRunStatus | 'ALL' {
  if (!raw?.trim()) return 'ALL';
  const v = raw.trim().toUpperCase();
  return PAYROLL_RUN_STATUSES.includes(v as PayrollRunStatus) ? (v as PayrollRunStatus) : 'ALL';
}

/** Finance payroll list URL with optional status filter (shareable). */
export function payrollRunsListHref(status?: PayrollRunStatus | 'ALL' | null): string {
  const base = '/finance/payroll';
  if (!status || status === 'ALL') return base;
  const q = new URLSearchParams({ [PAYROLL_RUNS_LIST_STATUS_QUERY]: status });
  return `${base}?${q.toString()}`;
}
