import { useCallback } from 'react';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { expensesApi, type Expense } from '@/lib/api/finance';

interface UseExpenseDetailOptions {
  open: boolean;
  initialExpense?: Expense | null;
  isDirty?: () => boolean;
}

export function useExpenseDetail(expenseId: string, options?: UseExpenseDetailOptions) {
  const open = options?.open ?? Boolean(expenseId);
  const { entity, setEntity, loading, hydrating, error, refresh } = useEntityDetailHydration({
    entityId: expenseId,
    open: open && Boolean(expenseId),
    initialEntity: options?.initialExpense,
    fetchById: expensesApi.getById,
    isDirty: options?.isDirty,
    loadErrorMessage: 'Expense could not be loaded.',
  });

  const fetchExpense = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return {
    expense: entity,
    setExpense: setEntity,
    loading,
    hydrating,
    error,
    fetchExpense,
  };
}
