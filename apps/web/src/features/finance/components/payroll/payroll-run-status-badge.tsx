'use client';

import { StatusBadge } from '@/components/shared';
import { payrollRunStatusUi } from '@/features/finance/constants/payroll-run-status-ui';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

export function PayrollRunStatusBadge({ status }: { status: PayrollRunStatus }) {
  const ui = payrollRunStatusUi(status);
  return <StatusBadge label={ui.label} variant={ui.variant} />;
}
