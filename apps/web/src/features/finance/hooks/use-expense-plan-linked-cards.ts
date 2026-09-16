'use client';

import { useCallback, useEffect, useState } from 'react';
import { isAccessRevokedApiError } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';

const LINKED_CARDS_PAGE_SIZE = 100;

type LinkedCardsState = {
  items: Expense[];
  error: boolean;
  loadedKey: string | null;
};

export function useExpensePlanLinkedCards(
  planId: string,
  refreshNonce: number,
): {
  items: Expense[];
  loading: boolean;
  error: boolean;
  reload: () => void;
} {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<LinkedCardsState>({
    items: [],
    error: false,
    loadedKey: null,
  });

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  const requestKey = `${planId}:${refreshNonce}:${reloadToken}`;
  const loading = Boolean(planId) && state.loadedKey !== requestKey;

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;
    void expensesApi
      .getAll({
        expensePlanId: planId,
        sortBy: 'dueDate',
        sortOrder: 'desc',
        pageSize: LINKED_CARDS_PAGE_SIZE,
      })
      .then((res) => {
        if (!cancelled) setState({ items: res.items, error: false, loadedKey: requestKey });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        // A failed refresh keeps the cards already on screen, unless the server withdrew read
        // access: those cards must not survive a denial.
        setState((prev) => ({
          items: isAccessRevokedApiError(caught) ? [] : prev.items,
          error: true,
          loadedKey: requestKey,
        }));
      });
    return () => {
      cancelled = true;
    };
  }, [planId, requestKey]);

  return {
    items: state.items,
    loading,
    error: state.loadedKey === requestKey && state.error,
    reload,
  };
}
