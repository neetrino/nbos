import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';

export function useExpensePlanDetail(planId: string) {
  const [plan, setPlan] = useState<ExpensePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await expensePlansApi.getById(planId);
      setPlan(data);
    } catch (caught) {
      setPlan(null);
      setError(getApiErrorMessage(caught, 'Expense plan could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void fetchPlan();
  }, [fetchPlan]);

  return { plan, loading, error, fetchPlan };
}
