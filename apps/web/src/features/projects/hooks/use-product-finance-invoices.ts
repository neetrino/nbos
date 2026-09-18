'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PRODUCT_FINANCE_INVOICE_PAGE_SIZE } from '@/features/projects/constants/product-finance.constants';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { invoicesApi, type Invoice } from '@/lib/api/finance';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';

export function useProductFinanceInvoices(productId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const invoicesRef = useRef(invoices);
  invoicesRef.current = invoices;
  const [truncated, setTruncated] = useState(false);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (!productId) return;
    beginLoad(invoicesRef.current.length > 0);
    try {
      const { items, meta } = await invoicesApi.getAll({
        productId,
        pageSize: PRODUCT_FINANCE_INVOICE_PAGE_SIZE,
      });
      setInvoices(items);
      setTruncated(meta.total > items.length);
      setError(null);
    } catch (caught) {
      // A failed refresh keeps the invoices already on screen, unless the server withdrew read
      // access: those invoices must not survive a denial.
      if (isAccessRevokedApiError(caught)) setInvoices([]);
      setError(getApiErrorMessage(caught, 'Invoices could not be loaded.'));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, productId]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, truncated, loading, error, refetch: fetchInvoices, setInvoices };
}
