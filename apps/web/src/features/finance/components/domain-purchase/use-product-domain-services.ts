'use client';

import { useCallback, useEffect, useState } from 'react';
import { clientServicesApi, type ClientServiceRecord } from '@/lib/api/client-services';

const DOMAIN_HEADER_PAGE_SIZE = 50;

export function useProductDomainServices(productId: string | null) {
  const [rows, setRows] = useState<ClientServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!productId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const result = await clientServicesApi.getAll({
        productId,
        type: 'DOMAIN',
        pageSize: DOMAIN_HEADER_PAGE_SIZE,
      });
      setRows(result.items.filter((row) => row.status !== 'CANCELLED'));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}
