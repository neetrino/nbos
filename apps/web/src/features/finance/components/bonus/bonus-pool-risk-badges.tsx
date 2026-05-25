'use client';

import { StatusBadge } from '@/components/shared';
import {
  bonusPoolRiskFlagUi,
  type BonusPoolRiskFlag,
} from '@/features/finance/constants/bonus-pool-risk-flags-ui';

export function BonusPoolRiskBadges({ flags }: { flags: readonly BonusPoolRiskFlag[] }) {
  if (flags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((flag) => {
        const ui = bonusPoolRiskFlagUi(flag);
        return <StatusBadge key={flag} label={ui.label} variant={ui.variant} />;
      })}
    </div>
  );
}
