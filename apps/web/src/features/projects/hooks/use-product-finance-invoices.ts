'use client';

import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_FINANCE_INVOICE_PAGE_SIZE } from '@/features/projects/constants/product-finance.constants';
import { invoicesApi, type Invoice } from '@/lib/api/finance';

export function useProductFinanceInvoices(productId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { items, meta } = await invoicesApi.getAll({
        productId,
        pageSize: PRODUCT_FINANCE_INVOICE_PAGE_SIZE,
      });
      setInvoices(items);
      setTruncated(meta.total > items.length);
      setError(null);
    } catch {
      setError('Invoices could not be loaded.');
      setInvoices([]);
      setTruncated(false);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, truncated, loading, error, refetch: fetchInvoices, setInvoices };
}
