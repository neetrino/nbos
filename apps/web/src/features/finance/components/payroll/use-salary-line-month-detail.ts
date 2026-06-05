'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import { meApi } from '@/lib/api/me';
import { payrollRunsApi, type SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

export type SalaryLineMonthDetailScope = 'finance' | 'wallet';

function salaryLineIdFromDetail(detail: SalaryLineMonthDetail): string {
  return detail.salaryLine.id;
}

export function useSalaryLineMonthDetail(
  salaryLineId: string | null,
  open: boolean,
  scope: SalaryLineMonthDetailScope = 'finance',
  initialDetail: SalaryLineMonthDetail | null = null,
) {
  const [detail, setDetail] = useState<SalaryLineMonthDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const fetchDetail = useCallback(async (lineId: string): Promise<SalaryLineMonthDetail> => {
    return scopeRef.current === 'wallet'
      ? meApi.getWalletSalaryLineMonthDetail(lineId)
      : payrollRunsApi.getSalaryLineMonthDetail(lineId);
  }, []);

  const reload = useCallback(async () => {
    if (!salaryLineId) {
      setDetail(null);
      return;
    }
    setHydrating(true);
    setLoadError(null);
    try {
      const result = await fetchDetail(salaryLineId);
      setDetail(result);
    } catch (caught) {
      setLoadError(getApiErrorMessage(caught, 'Could not load month compensation.'));
    } finally {
      setHydrating(false);
    }
  }, [fetchDetail, salaryLineId]);

  useEffect(() => {
    if (!open || !salaryLineId) {
      setDetail(null);
      setLoading(false);
      setHydrating(false);
      setLoadError(null);
      return;
    }

    const seed =
      initialDetail && salaryLineIdFromDetail(initialDetail) === salaryLineId
        ? initialDetail
        : null;
    if (seed) {
      setDetail(seed);
      setLoading(false);
      setLoadError(null);
    } else {
      setDetail(null);
      setLoading(true);
      setLoadError(null);
    }

    let cancelled = false;
    if (seed) setHydrating(true);

    void (async () => {
      try {
        const result = await fetchDetail(salaryLineId);
        if (cancelled) return;
        setDetail(result);
        setLoadError(null);
      } catch (caught) {
        if (cancelled) return;
        const message = getApiErrorMessage(caught, 'Could not load month compensation.');
        if (!seed) setDetail(null);
        setLoadError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchDetail, initialDetail, open, salaryLineId]);

  return { detail, loading, hydrating, loadError, reload, setDetail };
}
