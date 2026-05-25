'use client';

import { useCallback, useEffect, useState } from 'react';
import { EntityDetailSheetContent } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DetailSheetSection } from '@/components/shared/DetailSheetSection';
import { BonusPoolEmployeeBreakdown } from '@/features/finance/components/bonus/bonus-pool-employee-breakdown';
import { BonusPoolFundingTimeline } from '@/features/finance/components/bonus/bonus-pool-funding-timeline';
import { BonusPoolSheetSuggestedPanel } from '@/features/finance/components/bonus/bonus-pool-sheet-suggested-panel';
import { BonusPoolSheetSummary } from '@/features/finance/components/bonus/bonus-pool-sheet-summary';
import {
  bonusPoolKindLabel,
  bonusPoolOrderCodesLabel,
  bonusPoolScopeTitle,
} from '@/features/finance/utils/bonus-pool-display';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  bonusesApi,
  type BonusPoolEmployeeLine,
  type BonusPoolRiskFlag,
  type BonusPoolTimelineEvent,
  type BonusProductPoolRow,
} from '@/lib/api/bonus';

export function ProductBonusPoolSheet({
  pool,
  open,
  onOpenChange,
  onPoolsRefresh,
}: {
  pool: BonusProductPoolRow | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onPoolsRefresh?: () => void | Promise<void>;
}) {
  const [lines, setLines] = useState<BonusPoolEmployeeLine[]>([]);
  const [orderCodes, setOrderCodes] = useState<string[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<BonusPoolTimelineEvent[]>([]);
  const [riskFlags, setRiskFlags] = useState<BonusPoolRiskFlag[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const loadPoolDetail = useCallback(async (poolKey: string) => {
    setDetailLoading(true);
    setLinesError(null);
    setTimelineError(null);
    try {
      const [linesData, timelineData] = await Promise.all([
        bonusesApi.getProductPoolEmployeeLines(poolKey),
        bonusesApi.getProductPoolTimeline(poolKey),
      ]);
      setLines(linesData.lines);
      setOrderCodes(linesData.orderCodes);
      setTimelineEvents(timelineData.events);
      setRiskFlags(timelineData.riskFlags);
    } catch (caught) {
      setLines([]);
      setOrderCodes([]);
      setTimelineEvents([]);
      setRiskFlags([]);
      const message = getApiErrorMessage(caught, 'Pool detail could not be loaded.');
      setLinesError(message);
      setTimelineError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !pool) {
      setLines([]);
      setOrderCodes([]);
      setTimelineEvents([]);
      setRiskFlags([]);
      setLinesError(null);
      setTimelineError(null);
      return;
    }
    void loadPoolDetail(pool.poolKey);
  }, [loadPoolDetail, open, pool]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="auxiliary" className="gap-0">
        <SheetHeader>
          <SheetTitle>{pool ? bonusPoolScopeTitle(pool) : 'Product bonus pool'}</SheetTitle>
          <SheetDescription>
            {pool
              ? `${bonusPoolKindLabel(pool.poolKind)} · ${pool.projectCode} · ${bonusPoolOrderCodesLabel(pool)}`
              : 'Select a pool to inspect funding and employee bonuses.'}
          </SheetDescription>
        </SheetHeader>

        {pool ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6">
            <BonusPoolSheetSummary pool={pool} orderCodes={orderCodes} riskFlags={riskFlags} />

            <DetailSheetSection title="Suggested release">
              <BonusPoolSheetSuggestedPanel
                pool={pool}
                lines={lines}
                onAfterAutoRelease={async () => {
                  await loadPoolDetail(pool.poolKey);
                  await onPoolsRefresh?.();
                }}
              />
            </DetailSheetSection>

            <DetailSheetSection title="By employee">
              <p className="text-muted-foreground mb-3 text-xs">
                Planned vs released vs paid per person. Suggested release uses available pool
                funding proportionally.
              </p>
              <BonusPoolEmployeeBreakdown
                lines={lines}
                loading={detailLoading}
                error={linesError}
              />
            </DetailSheetSection>

            <DetailSheetSection title="Funding timeline">
              <BonusPoolFundingTimeline
                events={timelineEvents}
                loading={detailLoading}
                error={timelineError}
              />
            </DetailSheetSection>
          </div>
        ) : null}
      </EntityDetailSheetContent>
    </Sheet>
  );
}
