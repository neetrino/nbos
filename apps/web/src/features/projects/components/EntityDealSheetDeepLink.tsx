'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DealSheet } from '@/features/crm/components/DealSheet';
import { dealsApi, type Deal } from '@/lib/api/deals';
import { getApiErrorMessage, isStageGateApiError } from '@/lib/api-errors';

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
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const attemptedRef = useRef<string | null>(null);

  const loadDeal = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const loaded = await dealsApi.getById(id);
        setDeal(loaded);
      } catch {
        toast.error('Deal not found or you cannot open it.');
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    attemptedRef.current = null;
  }, [dealId]);

  useEffect(() => {
    if (!open || !dealId) {
      setDeal(null);
      return;
    }
    if (deal?.id === dealId) return;
    if (attemptedRef.current === dealId) return;
    attemptedRef.current = dealId;
    void loadDeal(dealId);
  }, [open, dealId, deal?.id, loadDeal]);

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
    if (!dealId) return;
    await loadDeal(dealId);
  }, [dealId, loadDeal]);

  if (!open || !deal) return null;

  return (
    <DealSheet
      deal={deal}
      open={open && !loading}
      onOpenChange={onOpenChange}
      onUpdate={handleUpdate}
      onStatusChange={handleStatusChange}
      onDelete={() => toast.message('Delete deals from the CRM pipeline.')}
      onRefresh={handleRefresh}
      onOpenDeal={(id) => void loadDeal(id)}
    />
  );
}
