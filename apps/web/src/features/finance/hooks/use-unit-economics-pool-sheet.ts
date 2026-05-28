'use client';

import { useCallback, useState } from 'react';
import type { BonusProductPoolRow } from '@/lib/api/bonus';
import { unitEconomicsApi } from '@/lib/api/unit-economics';
import { mapUeBonusPoolToProductRow } from '@/features/finance/utils/map-ue-bonus-pool-to-product-row';
import { getApiErrorMessage } from '@/lib/api-errors';

export function orderBonusPoolKey(orderId: string): string {
  return `order:${orderId}`;
}

export function useUnitEconomicsPoolSheet(onPoolsRefresh?: () => void) {
  const [pool, setPool] = useState<BonusProductPoolRow | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const detail = await unitEconomicsApi.orderDetail(orderId);
      const uePool = detail.bonusBreakdown.pool;
      if (!uePool) {
        setError('No bonus data for this delivery unit yet.');
        setPool(null);
        return;
      }
      setPool(mapUeBonusPoolToProductRow(uePool));
    } catch (caught: unknown) {
      setPool(null);
      setError(getApiErrorMessage(caught, 'Could not load bonus pool detail.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setPool(null);
      setError(null);
    }
  }, []);

  const refreshPools = useCallback(async () => {
    await onPoolsRefresh?.();
    if (pool?.anchorOrderId) {
      await openForOrder(pool.anchorOrderId);
    }
  }, [onPoolsRefresh, openForOrder, pool?.anchorOrderId]);

  return {
    pool,
    open,
    loading,
    error,
    openForOrder,
    handleOpenChange,
    refreshPools,
  };
}
