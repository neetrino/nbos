'use client';

import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { meApi } from '@/lib/api/me';
import { payrollRunsApi, type SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

export type SalaryLineMonthDetailScope = 'finance' | 'wallet';

export function useSalaryLineMonthDetail(
  salaryLineId: string | null,
  open: boolean,
  scope: SalaryLineMonthDetailScope = 'finance',
) {
  const [detail, setDetail] = useState<SalaryLineMonthDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!salaryLineId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const result =
        scope === 'wallet'
          ? await meApi.getWalletSalaryLineMonthDetail(salaryLineId)
          : await payrollRunsApi.getSalaryLineMonthDetail(salaryLineId);
      setDetail(result);
    } catch (caught) {
      setLoadError(getApiErrorMessage(caught, 'Could not load month compensation.'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [salaryLineId, scope]);

  useEffect(() => {
    if (!open || !salaryLineId) {
      setDetail(null);
      setLoadError(null);
      return;
    }
    void reload();
  }, [open, salaryLineId, reload]);

  return { detail, loading, loadError, reload };
}
