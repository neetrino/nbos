'use client';

import { EMPLOYEE_ONBOARDING_OWNER_TYPE } from '@nbos/shared';
import { EmployeeLifecycleChecklistPanel } from './EmployeeLifecycleChecklistPanel';

interface EmployeeOnboardingPanelProps {
  employeeId: string;
  canEdit: boolean;
}

export function EmployeeOnboardingPanel({ employeeId, canEdit }: EmployeeOnboardingPanelProps) {
  return (
    <EmployeeLifecycleChecklistPanel
      employeeId={employeeId}
      ownerEntityType={EMPLOYEE_ONBOARDING_OWNER_TYPE}
      title="Onboarding checklist"
      loadingLabel="Loading onboarding checklist…"
      emptyLabel="No onboarding checklist yet."
      completeToast="Onboarding checklist completed"
      canEdit={canEdit}
    />
  );
}
