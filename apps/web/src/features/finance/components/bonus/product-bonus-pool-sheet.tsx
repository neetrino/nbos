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
import { BonusPoolFundingMismatchBanner } from '@/features/finance/components/bonus/bonus-pool-funding-mismatch-banner';
import { BonusPoolSheetBonusesTab } from '@/features/finance/components/bonus/bonus-pool-sheet-bonuses-tab';
import {
  BONUS_POOL_DETAIL_SHEET_TABS,
  type BonusPoolDetailSheetTab,
} from '@/features/finance/components/bonus/bonus-pool-detail-sheet-tabs';
import { BonusPoolSheetFundingTab } from '@/features/finance/components/bonus/bonus-pool-sheet-funding-tab';
import { BonusPoolSheetGeneralTab } from '@/features/finance/components/bonus/bonus-pool-sheet-general-tab';
import { BonusPoolSheetHeader } from '@/features/finance/components/bonus/bonus-pool-sheet-header';
import { fetchBonusEntriesForPool } from '@/features/finance/utils/fetch-bonus-entries-for-pool';
import { detectBonusPoolFundingMismatch } from '@/features/finance/utils/bonus-pool-funding-mismatch';
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
  const [displayPool, setDisplayPool] = useState<BonusProductPoolRow | null>(null);
  const [lines, setLines] = useState<BonusPoolEmployeeLine[]>([]);
  const [entries, setEntries] = useState<BonusEntryListRow[]>([]);
  const [orderCodes, setOrderCodes] = useState<string[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<BonusPoolTimelineEvent[]>([]);
  const [riskFlags, setRiskFlags] = useState<BonusPoolRiskFlag[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [, setLinesError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [fundingSyncing, setFundingSyncing] = useState(false);
  const [fundingSyncError, setFundingSyncError] = useState<string | null>(null);

  const activePool = displayPool ?? pool;

  useEffect(() => {
    setDisplayPool(pool);
    setFundingSyncError(null);
  }, [pool]);

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

  const refreshDisplayPool = useCallback(async (poolKey: string) => {
    const pools = await bonusesApi.getProductPools();
    const updated = pools.find((row) => row.poolKey === poolKey) ?? null;
    if (updated) setDisplayPool(updated);
    return updated;
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

  const fundingMismatch = useMemo(() => {
    if (detailLoading || timelineError || !activePool) {
      return { hasMismatch: false, paymentsTotal: 0, ledgerReceived: 0 };
    }
    return detectBonusPoolFundingMismatch(activePool.ledgerReceivedAmount, timelineEvents);
  }, [activePool, detailLoading, timelineError, timelineEvents]);

  const handleReconcileFunding = useCallback(async () => {
    if (!activePool) return;
    setFundingSyncing(true);
    setFundingSyncError(null);
    try {
      await bonusesApi.syncProductPoolLedger(activePool.poolKey);
      await refreshDisplayPool(activePool.poolKey);
      await loadPoolDetail(activePool.poolKey, activePool.orderIds);
      await onPoolsRefresh?.();
    } catch (caught) {
      setFundingSyncError(getApiErrorMessage(caught, 'Pool funding could not be reconciled.'));
    } finally {
      setFundingSyncing(false);
    }
  }, [activePool, loadPoolDetail, onPoolsRefresh, refreshDisplayPool]);

  const handleAfterAutoRelease = useCallback(async () => {
    if (!activePool) return;
    await loadPoolDetail(activePool.poolKey, activePool.orderIds);
    await refreshDisplayPool(activePool.poolKey);
    await onPoolsRefresh?.();
  }, [activePool, loadPoolDetail, onPoolsRefresh, refreshDisplayPool]);

  const handleEntityChanged = useCallback(async () => {
    if (!activePool) return;
    await loadPoolDetail(activePool.poolKey, activePool.orderIds);
    await refreshDisplayPool(activePool.poolKey);
    await onPoolsRefresh?.();
  }, [activePool, loadPoolDetail, onPoolsRefresh, refreshDisplayPool]);

  const tabContent = useMemo(() => {
    if (!activePool) return null;
    if (activeTab === 'funding') {
      return (
        <BonusPoolSheetFundingTab
          pool={activePool}
          timelineEvents={timelineEvents}
          loading={detailLoading}
          error={timelineError}
        />
      );
    }
    if (activeTab === 'bonuses') {
      return (
        <BonusPoolSheetBonusesTab
          pool={activePool}
          lines={lines}
          entries={entries}
          entriesError={entriesError}
          onAfterAutoRelease={handleAfterAutoRelease}
        />
      );
    }
    return (
      <BonusPoolSheetGeneralTab
        pool={activePool}
        orderCodes={orderCodes}
        riskFlags={riskFlags}
        paymentCount={paymentCount}
        releaseCount={releaseCount}
        onOpenTab={setActiveTab}
      />
    );
  }, [
    activePool,
    activeTab,
    detailLoading,
    entries,
    entriesError,
    handleAfterAutoRelease,
    lines,
    orderCodes,
    paymentCount,
    releaseCount,
    riskFlags,
    timelineError,
    timelineEvents,
  ]);

  return (
    <EntityItemHost nested onEntityChanged={() => void handleEntityChanged()}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent open={open} layout="full" width="medium" className="gap-0">
          {activePool ? (
            <>
              <BonusPoolSheetHeader pool={activePool} />
              <DetailSheetTabBar
                tabs={BONUS_POOL_DETAIL_SHEET_TABS}
                activeTab={activeTab}
                onTabChange={(value) => setActiveTab(value as BonusPoolDetailSheetTab)}
              />
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-4 px-5 py-5">
                  <BonusPoolFundingMismatchBanner
                    mismatch={fundingMismatch}
                    syncing={fundingSyncing}
                    syncError={fundingSyncError}
                    onReconcile={handleReconcileFunding}
                  />
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
