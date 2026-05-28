const PAYROLL_RUN_DETAIL_PATH = /^\/finance\/payroll\/[^/]+$/;

/** True on `/finance/payroll/:runId` (allocation workspace), not the list. */
export function isFinancePayrollRunDetailPath(pathname: string): boolean {
  return PAYROLL_RUN_DETAIL_PATH.test(pathname);
}
