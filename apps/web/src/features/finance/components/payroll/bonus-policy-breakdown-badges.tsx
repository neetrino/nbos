'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from '@/components/shared';
import {
  BONUS_BREAKDOWN_STATUS_VARIANT,
  type BonusPolicyBreakdownStatus,
} from '@/features/finance/constants/bonus-breakdown-status-ui';
import { translateBonusBreakdownStatus } from '@/features/finance/components/payroll/payroll-compensation-i18n';

export function BonusPolicyBreakdownBadges({
  statuses,
}: {
  statuses: readonly BonusPolicyBreakdownStatus[];
}) {
  const t = useTranslations('payroll');

  if (statuses.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map((status) => (
        <StatusBadge
          key={status}
          label={translateBonusBreakdownStatus(status, t)}
          variant={BONUS_BREAKDOWN_STATUS_VARIANT[status]}
        />
      ))}
    </div>
  );
}
