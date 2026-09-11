'use client';

import { useEffect, useState } from 'react';
import { expensesApi } from '@/lib/api/finance';

/** Product-scoped expense total for the Product Hub finance header. */
export function useProductFinanceExpenseTotal(productId: string): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    void expensesApi
      .getStats({ productId })
      .then((stats) => {
        if (!cancelled) setTotal(stats.totalAmount ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return total;
}
