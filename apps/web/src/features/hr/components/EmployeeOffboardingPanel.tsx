'use client';

import { useTranslations } from 'next-intl';
import { EMPLOYEE_OFFBOARDING_OWNER_TYPE } from '@nbos/shared';
import { EmployeeLifecycleChecklistPanel } from './EmployeeLifecycleChecklistPanel';

interface EmployeeOffboardingPanelProps {
  employeeId: string;
  canEdit: boolean;
}

export function EmployeeOffboardingPanel({ employeeId, canEdit }: EmployeeOffboardingPanelProps) {
  const t = useTranslations('hr');
  return (
    <EmployeeLifecycleChecklistPanel
      employeeId={employeeId}
      ownerEntityType={EMPLOYEE_OFFBOARDING_OWNER_TYPE}
      title={t('offboarding.title')}
      loadingLabel={t('offboarding.loading')}
      emptyLabel={t('offboarding.empty')}
      completeToast={t('offboarding.completedToast')}
      canEdit={canEdit}
    />
  );
}
