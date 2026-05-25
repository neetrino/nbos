'use client';

import { StatusBadge } from '@/components/shared';
import {
  BONUS_BREAKDOWN_STATUS_LABEL,
  BONUS_BREAKDOWN_STATUS_VARIANT,
  type BonusPolicyBreakdownStatus,
} from '@/features/finance/constants/bonus-breakdown-status-ui';

export function BonusPolicyBreakdownBadges({
  statuses,
}: {
  statuses: readonly BonusPolicyBreakdownStatus[];
}) {
  if (statuses.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {statuses.map((status) => (
        <StatusBadge
          key={status}
          label={BONUS_BREAKDOWN_STATUS_LABEL[status]}
          variant={BONUS_BREAKDOWN_STATUS_VARIANT[status]}
        />
      ))}
    </div>
  );
}
