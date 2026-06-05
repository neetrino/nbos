import { useCallback } from 'react';
import { useEntityDetailHydration } from '@/hooks/use-entity-detail-hydration';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';

interface UseExpensePlanDetailOptions {
  open: boolean;
  initialPlan?: ExpensePlan | null;
  isDirty?: () => boolean;
}

export function useExpensePlanDetail(planId: string, options?: UseExpensePlanDetailOptions) {
  const open = options?.open ?? Boolean(planId);
  const { entity, loading, hydrating, error, refresh } = useEntityDetailHydration({
    entityId: planId,
    open: open && Boolean(planId),
    initialEntity: options?.initialPlan,
    fetchById: expensePlansApi.getById,
    isDirty: options?.isDirty,
    loadErrorMessage: 'Expense plan could not be loaded.',
  });

  const fetchPlan = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return { plan: entity, loading, hydrating, error, fetchPlan };
}
