import type { PayrollRunListRow, PayrollRunStatus } from '@/lib/api/payroll-runs';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';

/** Kanban column order for payroll runs (workflow left → right). */
export const PAYROLL_RUN_BOARD_LANE_ORDER: readonly PayrollRunStatus[] = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'PAYING',
  'CLOSED',
] as const;

export const PAYROLL_RUN_BOARD_LANE_LABEL: Record<PayrollRunStatus, string> =
  PAYROLL_RUN_STATUS_LABEL;

export function groupPayrollRunsByBoardLane(
  items: readonly PayrollRunListRow[],
): Record<PayrollRunStatus, PayrollRunListRow[]> {
  const lanes = Object.fromEntries(
    PAYROLL_RUN_BOARD_LANE_ORDER.map((status) => [status, [] as PayrollRunListRow[]]),
  ) as Record<PayrollRunStatus, PayrollRunListRow[]>;

  for (const item of items) {
    const bucket = lanes[item.status];
    if (bucket) {
      bucket.push(item);
    }
  }

  for (const status of PAYROLL_RUN_BOARD_LANE_ORDER) {
    lanes[status].sort((a, b) => b.payrollMonth.localeCompare(a.payrollMonth));
  }

  return lanes;
}
