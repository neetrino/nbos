'use client';

import { useTranslations } from 'next-intl';
import { EMPLOYEE_ONBOARDING_OWNER_TYPE } from '@nbos/shared';
import { EmployeeLifecycleChecklistPanel } from './EmployeeLifecycleChecklistPanel';

interface EmployeeOnboardingPanelProps {
  employeeId: string;
  canEdit: boolean;
}

export function EmployeeOnboardingPanel({ employeeId, canEdit }: EmployeeOnboardingPanelProps) {
  const t = useTranslations('hr');
  return (
    <EmployeeLifecycleChecklistPanel
      employeeId={employeeId}
      ownerEntityType={EMPLOYEE_ONBOARDING_OWNER_TYPE}
      title={t('onboarding.title')}
      loadingLabel={t('onboarding.loading')}
      emptyLabel={t('onboarding.empty')}
      completeToast={t('onboarding.completedToast')}
      canEdit={canEdit}
    />
  );
}
