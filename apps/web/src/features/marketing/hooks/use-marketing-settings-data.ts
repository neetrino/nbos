'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  marketingApi,
  type MarketingAccount,
  type MarketingCrmWhereOption,
} from '@/lib/api/marketing';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { loadExpensePlansForMarketingAccounts } from '@/features/marketing/utils/load-expense-plans-for-marketing-accounts';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';

export function useMarketingSettingsData() {
  const t = useTranslations('marketing');
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [crmWhereRows, setCrmWhereRows] = useState<MarketingCrmWhereOption[]>([]);
  const [expensePlans, setExpensePlans] = useState<ExpensePlan[]>([]);
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const {
    loading: plansLoading,
    begin: beginPlansLoad,
    end: endPlansLoad,
  } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const hasAccounts = accountsRef.current.length > 0;
    beginLoad(hasAccounts);
    beginPlansLoad(hasAccounts);
    try {
      const [nextAccounts, whereRows] = await Promise.all([
        marketingApi.getAccounts(),
        marketingApi.getCrmWhereOptions({ includeInactive: true }),
      ]);
      const plans = await loadExpensePlansForMarketingAccounts(nextAccounts);
      setAccounts(nextAccounts);
      setCrmWhereRows(whereRows);
      setExpensePlans(plans);
      setError(null);
    } catch (caught) {
      if (isAccessRevokedApiError(caught)) {
        setAccounts([]);
        setCrmWhereRows([]);
        setExpensePlans([]);
      }
      setError(getApiErrorMessage(caught, t('settings.loadError')));
    } finally {
      endLoad();
      endPlansLoad();
    }
  }, [beginLoad, beginPlansLoad, endLoad, endPlansLoad, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    accounts,
    crmWhereRows,
    expensePlans,
    loading,
    plansLoading,
    error,
    clearError: () => setError(null),
    reload,
  };
}
