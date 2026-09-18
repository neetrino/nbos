'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PRODUCT_FINANCE_ORDER_PAGE_SIZE } from '@/features/projects/constants/product-finance.constants';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { ordersApi, type Order } from '@/lib/api/finance';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';

export function useProductFinanceOrders(projectId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const [truncated, setTruncated] = useState(false);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!projectId) return;
    beginLoad(ordersRef.current.length > 0);
    try {
      const { items, meta } = await ordersApi.getAll({
        projectId,
        pageSize: PRODUCT_FINANCE_ORDER_PAGE_SIZE,
      });
      setOrders(items);
      setTruncated(meta.total > items.length);
      setError(null);
    } catch (caught) {
      if (isAccessRevokedApiError(caught)) setOrders([]);
      setError(getApiErrorMessage(caught, 'Orders could not be loaded.'));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, projectId]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  return { orders, truncated, loading, error, refetch: fetchOrders };
}
