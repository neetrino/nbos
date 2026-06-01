'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollAllocationMatrixApi,
  type PayrollAllocationMatrix,
  type PayrollMatrixViewMode,
} from '@/lib/api/payroll-allocation-matrix';
import {
  payrollEmployeeBonusHistoryApi,
  type PayrollEmployeeBonusHistoryMeta,
} from '@/lib/api/payroll-employee-bonus-history';

export function usePayrollRunMatrixCache(payrollRunId: string, enabled: boolean) {
  const [scopeId, setScopeId] = useState(payrollRunId);
  const [meta, setMeta] = useState<PayrollEmployeeBonusHistoryMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [matrixByMode, setMatrixByMode] = useState<
    Partial<Record<PayrollMatrixViewMode, PayrollAllocationMatrix>>
  >({});
  const [matrixLoadingMode, setMatrixLoadingMode] = useState<PayrollMatrixViewMode | null>(null);

  const metaPromiseRef = useRef<Promise<PayrollEmployeeBonusHistoryMeta | null> | null>(null);
  const matrixPromiseRef = useRef<
    Partial<Record<PayrollMatrixViewMode, Promise<PayrollAllocationMatrix | null>>>
  >({});

  if (payrollRunId !== scopeId) {
    setScopeId(payrollRunId);
    setMeta(null);
    setMetaError(null);
    setMatrixByMode({});
    setMatrixLoadingMode(null);
  }

  useEffect(() => {
    metaPromiseRef.current = null;
    matrixPromiseRef.current = {};
  }, [payrollRunId]);

  const reset = useCallback(() => {
    setMeta(null);
    setMetaError(null);
    setMatrixByMode({});
    setMatrixLoadingMode(null);
    metaPromiseRef.current = null;
    matrixPromiseRef.current = {};
  }, []);

  const ensureMeta = useCallback(async (): Promise<PayrollEmployeeBonusHistoryMeta | null> => {
    if (meta) return meta;
    if (metaPromiseRef.current) return metaPromiseRef.current;

    const promise = payrollEmployeeBonusHistoryApi
      .getMeta(payrollRunId)
      .then((result) => {
        setMeta(result);
        setMetaError(null);
        return result;
      })
      .catch((caught) => {
        const message = getApiErrorMessage(caught, 'Bonus history context could not be loaded.');
        setMetaError(message);
        return null;
      })
      .finally(() => {
        metaPromiseRef.current = null;
      });

    metaPromiseRef.current = promise;
    return promise;
  }, [meta, payrollRunId]);

  const ensureMatrix = useCallback(
    async (viewMode: PayrollMatrixViewMode): Promise<PayrollAllocationMatrix | null> => {
      const cached = matrixByMode[viewMode];
      if (cached) return cached;

      const inflight = matrixPromiseRef.current[viewMode];
      if (inflight) return inflight;

      queueMicrotask(() => setMatrixLoadingMode(viewMode));
      const promise = payrollAllocationMatrixApi
        .get(payrollRunId, viewMode)
        .then((result) => {
          setMatrixByMode((prev) => ({ ...prev, [viewMode]: result }));
          return result;
        })
        .catch(() => null)
        .finally(() => {
          setMatrixLoadingMode((current) => (current === viewMode ? null : current));
          delete matrixPromiseRef.current[viewMode];
        });

      matrixPromiseRef.current[viewMode] = promise;
      return promise;
    },
    [matrixByMode, payrollRunId],
  );

  const setMatrixForMode = useCallback(
    (viewMode: PayrollMatrixViewMode, matrix: PayrollAllocationMatrix) => {
      setMatrixByMode((prev) => ({ ...prev, [viewMode]: matrix }));
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    queueMicrotask(() => {
      void ensureMeta();
      void ensureMatrix('EMPLOYEE_MATRIX');
    });
  }, [enabled, ensureMeta, ensureMatrix]);

  return {
    meta,
    metaError,
    matrixByMode,
    matrixLoadingMode,
    ensureMeta,
    ensureMatrix,
    setMatrixForMode,
    reset,
  };
}
