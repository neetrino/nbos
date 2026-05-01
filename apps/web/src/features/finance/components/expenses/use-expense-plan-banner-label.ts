'use client';

import { useEffect, useState } from 'react';
import { expensePlansApi } from '@/lib/api/expense-plans';

/**
 * Loads expense plan name for the plan drill-down banner when `expensePlanId` is in the list URL.
 */
export function useExpensePlanBannerLabel(expensePlanIdFromUrl: string | null): string | null {
  const [banner, setBanner] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (!expensePlanIdFromUrl) return;
    let cancelled = false;
    expensePlansApi
      .getById(expensePlanIdFromUrl)
      .then((plan) => {
        if (!cancelled) {
          setBanner({ id: expensePlanIdFromUrl, text: plan.name });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBanner({ id: expensePlanIdFromUrl, text: '' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [expensePlanIdFromUrl]);

  if (!expensePlanIdFromUrl || banner?.id !== expensePlanIdFromUrl) return null;
  return banner.text || null;
}
