'use client';

import { Button } from '@/components/ui/button';
import { payrollRunActionOptions } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunDetail, PayrollRunStatus } from '@/lib/api/payroll-runs';

export function PayrollRunDetailStatusActions({
  run,
  statusBusy,
  onApplyStatus,
}: {
  run: PayrollRunDetail;
  statusBusy: boolean;
  onApplyStatus: (next: PayrollRunStatus) => void;
}) {
  const actions = payrollRunActionOptions(run.status);

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      {actions.map((action) => (
        <Button
          key={action.to}
          type="button"
          variant={action.to === 'DRAFT' ? 'outline' : 'default'}
          disabled={statusBusy}
          onClick={() => void onApplyStatus(action.to)}
        >
          {action.label}
        </Button>
      ))}
    </>
  );
}
