'use client';

import { useEffect, useState } from 'react';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';

const ACTIVE_PLAN_PAGE_SIZE = 100;

/** Loads ACTIVE expense plans for the create-expense plan picker. */
export function useActiveExpensePlans(enabled: boolean): ExpensePlan[] {
  const [plans, setPlans] = useState<ExpensePlan[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void expensePlansApi
      .getAll({
        status: 'ACTIVE',
        pageSize: ACTIVE_PLAN_PAGE_SIZE,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      .then((res) => {
        if (!cancelled) setPlans(res.items);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return plans;
}
