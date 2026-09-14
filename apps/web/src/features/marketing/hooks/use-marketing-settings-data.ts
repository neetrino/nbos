'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  marketingApi,
  type MarketingAccount,
  type MarketingCrmWhereOption,
} from '@/lib/api/marketing';
import type { ExpensePlan } from '@/lib/api/expense-plans';
import { loadExpensePlansForMarketingAccounts } from '@/features/marketing/utils/load-expense-plans-for-marketing-accounts';

export function useMarketingSettingsData() {
  const t = useTranslations('marketing');
  const [accounts, setAccounts] = useState<MarketingAccount[]>([]);
  const [crmWhereRows, setCrmWhereRows] = useState<MarketingCrmWhereOption[]>([]);
  const [expensePlans, setExpensePlans] = useState<ExpensePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setPlansLoading(true);
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
    } catch {
      setError(t('settings.loadError'));
    } finally {
      setLoading(false);
      setPlansLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { accounts, crmWhereRows, expensePlans, loading, plansLoading, error, reload };
}
