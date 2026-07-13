'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DealSheet } from '@/features/crm/components/DealSheet';
import { dealsApi, type Deal } from '@/lib/api/deals';
import { getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

interface EntityDealSheetDeepLinkProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EntityDealSheetDeepLink({
  dealId,
  open,
  onOpenChange,
}: EntityDealSheetDeepLinkProps) {
  const { persistedValue: renderDealId, onOpenChangeComplete: clearRenderDealId } =
    useSheetPersistedValue(dealId);
  const hostMounted = useSheetHostMounted(open, renderDealId);

  const [deal, setDeal] = useState<Deal | null>(null);
  const activeDealId = open && renderDealId ? renderDealId : null;
  const [trackedDealId, setTrackedDealId] = useState(activeDealId);

  if (activeDealId !== trackedDealId) {
    setTrackedDealId(activeDealId);
    if (deal && deal.id !== activeDealId) setDeal(null);
  }

  useEffect(() => {
    if (!open || !renderDealId) return;

    let cancelled = false;
    void dealsApi
      .getById(renderDealId)
      .then((loaded) => {
        if (!cancelled) setDeal(loaded);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Deal not found or you cannot open it.');
          onOpenChange(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [renderDealId, onOpenChange, open]);

  const handleOpenChangeComplete = useCallback(
    (nextOpen: boolean) => {
      clearRenderDealId(nextOpen);
      if (!nextOpen) setDeal(null);
    },
    [clearRenderDealId],
  );

  const handleUpdate = useCallback(async (id: string, data: Partial<Deal>) => {
    try {
      const updated = await dealsApi.update(id, data);
      setDeal(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not save deal.'));
      throw err;
    }
  }, []);

  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      if (!deal || deal.id !== id) return;
      try {
        const updated = await dealsApi.updateStatus(id, status);
        setDeal(updated);
      } catch (err) {
        if (isStageGateApiError(err)) {
          toast.error('Complete required fields in the deal sheet before changing stage.');
          return;
        }
        toast.error(getApiErrorMessage(err, 'Deal stage change was blocked.'));
      }
    },
    [deal],
  );

  const handleRefresh = useCallback(async () => {
    if (!renderDealId) return;
    try {
      const loaded = await dealsApi.getById(renderDealId);
      setDeal(loaded);
    } catch {
      toast.error('Deal could not be refreshed.');
    }
  }, [renderDealId]);

  const handleOpenDeal = useCallback(async (id: string) => {
    try {
      const loaded = await dealsApi.getById(id);
      setDeal(loaded);
    } catch {
      toast.error('Deal not found or you cannot open it.');
    }
  }, []);

  if (!hostMounted) return null;

  return (
    <DealSheet
      deal={deal}
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      onUpdate={handleUpdate}
      onStatusChange={handleStatusChange}
      onRefresh={handleRefresh}
      onOpenDeal={(id) => void handleOpenDeal(id)}
    />
  );
}
