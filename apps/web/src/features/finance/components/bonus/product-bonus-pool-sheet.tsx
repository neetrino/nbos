'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import {
  DetailSheetTabBar,
  EntityDetailSheetContent,
  EntityItemHost,
  LoadingState,
} from '@/components/shared';
import { BonusPoolSheetBonusesTab } from '@/features/finance/components/bonus/bonus-pool-sheet-bonuses-tab';
import {
  BONUS_POOL_DETAIL_SHEET_TABS,
  type BonusPoolDetailSheetTab,
} from '@/features/finance/components/bonus/bonus-pool-detail-sheet-tabs';
import { BonusPoolSheetFundingTab } from '@/features/finance/components/bonus/bonus-pool-sheet-funding-tab';
import { BonusPoolSheetGeneralTab } from '@/features/finance/components/bonus/bonus-pool-sheet-general-tab';
import { BonusPoolSheetHeader } from '@/features/finance/components/bonus/bonus-pool-sheet-header';
import { fetchBonusEntriesForPool } from '@/features/finance/utils/fetch-bonus-entries-for-pool';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  bonusesApi,
  type BonusEntryListRow,
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
  const [activeTab, setActiveTab] = useState<BonusPoolDetailSheetTab>('general');
  const [lines, setLines] = useState<BonusPoolEmployeeLine[]>([]);
  const [entries, setEntries] = useState<BonusEntryListRow[]>([]);
  const [orderCodes, setOrderCodes] = useState<string[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<BonusPoolTimelineEvent[]>([]);
  const [riskFlags, setRiskFlags] = useState<BonusPoolRiskFlag[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linesError, setLinesError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const loadPoolDetail = useCallback(async (poolKey: string, orderIds: string[]) => {
    setDetailLoading(true);
    setLinesError(null);
    setEntriesError(null);
    setTimelineError(null);
    try {
      const [linesData, timelineData, entryRows] = await Promise.all([
        bonusesApi.getProductPoolEmployeeLines(poolKey),
        bonusesApi.getProductPoolTimeline(poolKey),
        fetchBonusEntriesForPool(orderIds),
      ]);
      setLines(linesData.lines);
      setOrderCodes(linesData.orderCodes);
      setTimelineEvents(timelineData.events);
      setRiskFlags(timelineData.riskFlags);
      setEntries(entryRows);
    } catch (caught) {
      const message = getApiErrorMessage(caught, 'Pool detail could not be loaded.');
      setLines([]);
      setEntries([]);
      setOrderCodes([]);
      setTimelineEvents([]);
      setRiskFlags([]);
      setLinesError(message);
      setEntriesError(message);
      setTimelineError(message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !pool) {
      setLines([]);
      setEntries([]);
      setOrderCodes([]);
      setTimelineEvents([]);
      setRiskFlags([]);
      setLinesError(null);
      setEntriesError(null);
      setTimelineError(null);
      setActiveTab('general');
      return;
    }
    void loadPoolDetail(pool.poolKey, pool.orderIds);
  }, [loadPoolDetail, open, pool]);

  const paymentCount = useMemo(
    () => timelineEvents.filter((event) => event.kind === 'PAYMENT_IN').length,
    [timelineEvents],
  );
  const releaseCount = useMemo(
    () => timelineEvents.filter((event) => event.kind === 'RELEASE_OUT').length,
    [timelineEvents],
  );

  const handleAfterAutoRelease = useCallback(async () => {
    if (!pool) return;
    await loadPoolDetail(pool.poolKey, pool.orderIds);
    await onPoolsRefresh?.();
  }, [loadPoolDetail, onPoolsRefresh, pool]);

  const handleEntityChanged = useCallback(async () => {
    if (!pool) return;
    await loadPoolDetail(pool.poolKey, pool.orderIds);
    await onPoolsRefresh?.();
  }, [loadPoolDetail, onPoolsRefresh, pool]);

  const tabContent = useMemo(() => {
    if (!pool) return null;
    if (activeTab === 'funding') {
      return (
        <BonusPoolSheetFundingTab
          pool={pool}
          timelineEvents={timelineEvents}
          loading={detailLoading}
          error={timelineError}
        />
      );
    }
    if (activeTab === 'bonuses') {
      return (
        <BonusPoolSheetBonusesTab
          pool={pool}
          lines={lines}
          entries={entries}
          loading={detailLoading}
          linesError={linesError}
          entriesError={entriesError}
          onAfterAutoRelease={handleAfterAutoRelease}
        />
      );
    }
    return (
      <BonusPoolSheetGeneralTab
        pool={pool}
        paymentCount={paymentCount}
        releaseCount={releaseCount}
        onOpenTab={setActiveTab}
      />
    );
  }, [
    activeTab,
    detailLoading,
    entries,
    entriesError,
    handleAfterAutoRelease,
    lines,
    linesError,
    paymentCount,
    pool,
    releaseCount,
    timelineError,
    timelineEvents,
  ]);

  return (
    <EntityItemHost nested onEntityChanged={() => void handleEntityChanged()}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent open={open} layout="full" width="medium" className="gap-0">
          {pool ? (
            <>
              <BonusPoolSheetHeader pool={pool} orderCodes={orderCodes} riskFlags={riskFlags} />
              <DetailSheetTabBar
                tabs={BONUS_POOL_DETAIL_SHEET_TABS}
                activeTab={activeTab}
                onTabChange={(value) => setActiveTab(value as BonusPoolDetailSheetTab)}
              />
              <ScrollArea className="min-h-0 flex-1">
                <div className="px-5 py-5">
                  {detailLoading && activeTab === 'general' ? (
                    <LoadingState count={3} />
                  ) : (
                    tabContent
                  )}
                </div>
              </ScrollArea>
            </>
          ) : null}
        </EntityDetailSheetContent>
      </Sheet>
    </EntityItemHost>
  );
}
