import type { StatusVariant } from '@/components/shared/StatusBadge';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';

export const PAYROLL_RUN_STATUS_UI: Record<
  PayrollRunStatus,
  { label: string; variant: StatusVariant }
> = {
  DRAFT: { label: PAYROLL_RUN_STATUS_LABEL.DRAFT, variant: 'gray' },
  REVIEW: { label: PAYROLL_RUN_STATUS_LABEL.REVIEW, variant: 'amber' },
  APPROVED: { label: PAYROLL_RUN_STATUS_LABEL.APPROVED, variant: 'blue' },
  PAYING: { label: PAYROLL_RUN_STATUS_LABEL.PAYING, variant: 'orange' },
  CLOSED: { label: PAYROLL_RUN_STATUS_LABEL.CLOSED, variant: 'green' },
};

export function payrollRunStatusUi(status: PayrollRunStatus) {
  return PAYROLL_RUN_STATUS_UI[status] ?? { label: status, variant: 'gray' as StatusVariant };
}
