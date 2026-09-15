'use client';

import { useCallback, useEffect, useState } from 'react';
import { expensesApi, type Expense } from '@/lib/api/finance';

const LINKED_CARDS_PAGE_SIZE = 100;

export function useExpensePlanLinkedCards(
  planId: string,
  refreshNonce: number,
): {
  items: Expense[];
  loading: boolean;
  error: boolean;
  reload: () => void;
} {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    void expensesApi
      .getAll({
        expensePlanId: planId,
        sortBy: 'dueDate',
        sortOrder: 'desc',
        pageSize: LINKED_CARDS_PAGE_SIZE,
      })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [planId, refreshNonce, reloadToken]);

  return { items, loading, error, reload };
}
