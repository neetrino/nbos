'use client';

import { EMPLOYEE_OFFBOARDING_OWNER_TYPE } from '@nbos/shared';
import { EmployeeLifecycleChecklistPanel } from './EmployeeLifecycleChecklistPanel';

interface EmployeeOffboardingPanelProps {
  employeeId: string;
  canEdit: boolean;
}

export function EmployeeOffboardingPanel({ employeeId, canEdit }: EmployeeOffboardingPanelProps) {
  return (
    <EmployeeLifecycleChecklistPanel
      employeeId={employeeId}
      ownerEntityType={EMPLOYEE_OFFBOARDING_OWNER_TYPE}
      title="Offboarding checklist"
      loadingLabel="Loading offboarding checklist…"
      emptyLabel="No offboarding checklist yet."
      completeToast="Offboarding checklist completed"
      canEdit={canEdit}
    />
  );
}
