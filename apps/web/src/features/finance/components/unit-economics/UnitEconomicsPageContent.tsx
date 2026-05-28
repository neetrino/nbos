'use client';

import { useState } from 'react';
import { ViewModeSwitch } from '@/components/shared';
import { BonusPoolsPageContent } from '@/features/finance/components/bonus/BonusPoolsPageContent';
import { UnitEconomicsOverviewTable } from '@/features/finance/components/unit-economics/UnitEconomicsOverviewTable';

const UNIT_ECONOMICS_VIEWS = [
  { value: 'overview' as const, label: 'Overview' },
  { value: 'funding' as const, label: 'Funding / cash' },
  { value: 'bonus-pools' as const, label: 'Bonus pools' },
];

type UnitEconomicsView = (typeof UNIT_ECONOMICS_VIEWS)[number]['value'];

/** Unit economics workspace — delivery unit financial state and bonus pool drill-down. */
export function UnitEconomicsPageContent() {
  const [view, setView] = useState<UnitEconomicsView>('overview');

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Financial state per delivery product or extension: received funds, expenses, bonuses,
        available cash, and margin indicators.
      </p>
      <ViewModeSwitch
        value={view}
        options={UNIT_ECONOMICS_VIEWS}
        onChange={setView}
        ariaLabel="Unit economics view"
      />
      {view === 'overview' ? <UnitEconomicsOverviewTable variant="overview" /> : null}
      {view === 'funding' ? <UnitEconomicsOverviewTable variant="funding" /> : null}
      {view === 'bonus-pools' ? (
        <BonusPoolsPageContent documentTitle="Unit economics — bonus pools" />
      ) : null}
    </div>
  );
}
