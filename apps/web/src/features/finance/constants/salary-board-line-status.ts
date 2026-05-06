import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { SalaryLineStatus } from '@/lib/api/payroll-runs';

export const SALARY_LINE_STATUS_BOARD: Record<
  SalaryLineStatus,
  { label: string; variant: StatusVariant }
> = {
  PENDING: { label: 'Pending', variant: 'amber' },
  APPROVED: { label: 'Approved', variant: 'blue' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'orange' },
  PAID: { label: 'Paid', variant: 'green' },
  HELD: { label: 'Held', variant: 'gray' },
};

export function salaryLineStatusBoardUi(status: SalaryLineStatus) {
  return SALARY_LINE_STATUS_BOARD[status] ?? { label: status, variant: 'gray' as StatusVariant };
}
