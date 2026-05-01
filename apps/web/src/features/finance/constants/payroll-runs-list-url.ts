import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

/** Must match `GET /payroll-runs?status=` (PayrollRunsController). */
export const PAYROLL_RUNS_LIST_STATUS_QUERY = 'status' as const;

/** Must match `GET /payroll-runs?payrollMonthFrom=` and stats route. */
export const PAYROLL_RUNS_LIST_MONTH_FROM_QUERY = 'payrollMonthFrom' as const;

/** Must match `GET /payroll-runs?payrollMonthTo=`. */
export const PAYROLL_RUNS_LIST_MONTH_TO_QUERY = 'payrollMonthTo' as const;

const PAYROLL_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

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

/** Returns `YYYY-MM` when valid; otherwise `undefined` (invalid query is ignored). */
export function parsePayrollRunsListMonthParam(raw: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const v = raw.trim();
  return PAYROLL_MONTH_REGEX.test(v) ? v : undefined;
}

export interface PayrollRunsListHrefOptions {
  status?: PayrollRunStatus | 'ALL' | null;
  payrollMonthFrom?: string;
  payrollMonthTo?: string;
}

/** Finance payroll list URL with optional status and month range (shareable). */
export function payrollRunsListHref(
  status?: PayrollRunStatus | 'ALL' | null,
  monthRange?: Pick<PayrollRunsListHrefOptions, 'payrollMonthFrom' | 'payrollMonthTo'>,
): string {
  const base = '/finance/payroll';
  const params = new URLSearchParams();
  if (status && status !== 'ALL') {
    params.set(PAYROLL_RUNS_LIST_STATUS_QUERY, status);
  }
  if (monthRange?.payrollMonthFrom) {
    params.set(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY, monthRange.payrollMonthFrom);
  }
  if (monthRange?.payrollMonthTo) {
    params.set(PAYROLL_RUNS_LIST_MONTH_TO_QUERY, monthRange.payrollMonthTo);
  }
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}
