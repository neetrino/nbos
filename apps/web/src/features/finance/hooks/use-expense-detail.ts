import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensesApi, type Expense } from '@/lib/api/finance';

export function useExpenseDetail(expenseId: string) {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpense = useCallback(async () => {
    if (!expenseId) {
      setExpense(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await expensesApi.getById(expenseId);
      setExpense(data);
    } catch (caught) {
      setExpense(null);
      setError(getApiErrorMessage(caught, 'Expense could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useEffect(() => {
    void fetchExpense();
  }, [fetchExpense]);

  return { expense, setExpense, loading, error, fetchExpense };
}
