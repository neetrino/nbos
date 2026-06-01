'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  buildOptimisticEmployeeBonusHistory,
  mergeEmployeeBonusHistorySlice,
} from '@/features/finance/utils/build-employee-bonus-history-view';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollAllocationMatrixApi,
  type PayrollAllocationMatrix,
} from '@/lib/api/payroll-allocation-matrix';
import {
  payrollEmployeeBonusHistoryApi,
  type PayrollEmployeeBonusHistory,
  type PayrollEmployeeBonusHistoryMeta,
  type PayrollEmployeeBonusHistorySlice,
} from '@/lib/api/payroll-employee-bonus-history';

function sharedEmployeeMatrixReady(
  matrix: PayrollAllocationMatrix | null | undefined,
  payrollRunId: string,
): matrix is PayrollAllocationMatrix {
  return (
    matrix != null &&
    matrix.payrollRunId === payrollRunId &&
    matrix.layout.viewMode === 'EMPLOYEE_MATRIX'
  );
}

type Params = {
  payrollRunId: string;
  sharedMeta: PayrollEmployeeBonusHistoryMeta | null;
  sharedEmployeeMatrix: PayrollAllocationMatrix | null;
  onSharedMatrixChange?: (matrix: PayrollAllocationMatrix) => void;
  sharedMetaError: string | null;
};

export function usePayrollEmployeeBonusHistoryData({
  payrollRunId,
  sharedMeta,
  sharedEmployeeMatrix,
  onSharedMatrixChange,
  sharedMetaError,
}: Params) {
  const [meta, setMeta] = useState<PayrollEmployeeBonusHistoryMeta | null>(null);
  const [matrix, setMatrix] = useState<PayrollAllocationMatrix | null>(null);
  const [displayData, setDisplayData] = useState<PayrollEmployeeBonusHistory | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [historyMonthsLoading, setHistoryMonthsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sliceCacheRef = useRef<Map<string, PayrollEmployeeBonusHistorySlice>>(new Map());
  const sliceRequestRef = useRef(0);
  const initializedRunIdRef = useRef<string | null>(null);

  const loadSlice = useCallback(
    async (
      employeeId: string,
      metaSnapshot: PayrollEmployeeBonusHistoryMeta,
      matrixSnapshot: PayrollAllocationMatrix,
      showHistoryLoading: boolean,
    ) => {
      const optimistic = () =>
        buildOptimisticEmployeeBonusHistory(metaSnapshot, matrixSnapshot, employeeId);

      const cached = sliceCacheRef.current.get(employeeId);
      if (cached) {
        setDisplayData(mergeEmployeeBonusHistorySlice(optimistic(), cached, matrixSnapshot));
        return;
      }

      const requestId = sliceRequestRef.current + 1;
      sliceRequestRef.current = requestId;
      if (showHistoryLoading) setHistoryMonthsLoading(true);

      try {
        const slice = await payrollEmployeeBonusHistoryApi.getSlice(payrollRunId, employeeId);
        if (sliceRequestRef.current !== requestId) return;
        sliceCacheRef.current.set(employeeId, slice);
        setDisplayData(mergeEmployeeBonusHistorySlice(optimistic(), slice, matrixSnapshot));
      } catch (caught) {
        if (sliceRequestRef.current !== requestId) return;
        toast.error(getApiErrorMessage(caught, 'Bonus history could not be loaded.'));
      } finally {
        if (sliceRequestRef.current === requestId) setHistoryMonthsLoading(false);
      }
    },
    [payrollRunId],
  );

  const startWithContext = useCallback(
    (metaResult: PayrollEmployeeBonusHistoryMeta, matrixResult: PayrollAllocationMatrix) => {
      setMeta(metaResult);
      setMatrix(matrixResult);
      const firstId = metaResult.employees[0]?.employeeId ?? null;
      setSelectedEmployeeId(firstId);
      if (!firstId) {
        setDisplayData(null);
        return;
      }
      setDisplayData(buildOptimisticEmployeeBonusHistory(metaResult, matrixResult, firstId));
      void loadSlice(firstId, metaResult, matrixResult, true);
    },
    [loadSlice],
  );

  const initialize = useCallback(async () => {
    setBootstrapLoading(true);
    setError(sharedMetaError);
    sliceCacheRef.current.clear();
    sliceRequestRef.current += 1;

    try {
      if (sharedMeta && sharedEmployeeMatrixReady(sharedEmployeeMatrix, payrollRunId)) {
        startWithContext(sharedMeta, sharedEmployeeMatrix);
        return;
      }
      const metaResult = sharedMeta ?? (await payrollEmployeeBonusHistoryApi.getMeta(payrollRunId));
      const matrixResult = sharedEmployeeMatrixReady(sharedEmployeeMatrix, payrollRunId)
        ? sharedEmployeeMatrix
        : await payrollAllocationMatrixApi.get(payrollRunId, 'EMPLOYEE_MATRIX');
      if (!sharedEmployeeMatrixReady(sharedEmployeeMatrix, payrollRunId)) {
        onSharedMatrixChange?.(matrixResult);
      }
      startWithContext(metaResult, matrixResult);
    } catch (caught) {
      setMeta(null);
      setMatrix(null);
      setDisplayData(null);
      setError(getApiErrorMessage(caught, 'Employee bonus history could not be loaded.'));
    } finally {
      setBootstrapLoading(false);
    }
  }, [
    onSharedMatrixChange,
    payrollRunId,
    sharedEmployeeMatrix,
    sharedMeta,
    sharedMetaError,
    startWithContext,
  ]);

  useEffect(() => {
    if (initializedRunIdRef.current === payrollRunId) return;
    initializedRunIdRef.current = payrollRunId;
    void initialize();
  }, [initialize, payrollRunId]);

  useEffect(() => {
    if (!meta || !sharedEmployeeMatrixReady(sharedEmployeeMatrix, payrollRunId)) return;
    if (matrix === sharedEmployeeMatrix) return;

    setMatrix(sharedEmployeeMatrix);
    sliceCacheRef.current.clear();
    if (!selectedEmployeeId) return;
    setDisplayData(
      buildOptimisticEmployeeBonusHistory(meta, sharedEmployeeMatrix, selectedEmployeeId),
    );
    void loadSlice(selectedEmployeeId, meta, sharedEmployeeMatrix, true);
  }, [loadSlice, matrix, meta, payrollRunId, selectedEmployeeId, sharedEmployeeMatrix]);

  const selectEmployee = useCallback(
    (employeeId: string) => {
      if (!meta || !matrix || employeeId === selectedEmployeeId) return;
      setSelectedEmployeeId(employeeId);
      setDisplayData(buildOptimisticEmployeeBonusHistory(meta, matrix, employeeId));
      void loadSlice(employeeId, meta, matrix, !sliceCacheRef.current.has(employeeId));
    },
    [loadSlice, matrix, meta, selectedEmployeeId],
  );

  const prefetchSlice = useCallback(
    (employeeId: string) => {
      if (!meta || !matrix) return;
      if (employeeId === selectedEmployeeId || sliceCacheRef.current.has(employeeId)) return;
      void loadSlice(employeeId, meta, matrix, false);
    },
    [loadSlice, matrix, meta, selectedEmployeeId],
  );

  const applyMatrixUpdate = useCallback(
    (updatedMatrix: PayrollAllocationMatrix) => {
      if (!meta || !selectedEmployeeId) return;
      setMatrix(updatedMatrix);
      onSharedMatrixChange?.(updatedMatrix);
      sliceCacheRef.current.delete(selectedEmployeeId);
      setDisplayData(buildOptimisticEmployeeBonusHistory(meta, updatedMatrix, selectedEmployeeId));
      void loadSlice(selectedEmployeeId, meta, updatedMatrix, true);
    },
    [loadSlice, meta, onSharedMatrixChange, selectedEmployeeId],
  );

  const reload = useCallback(() => {
    initializedRunIdRef.current = null;
    void initialize();
  }, [initialize]);

  return {
    meta,
    matrix,
    displayData,
    selectedEmployeeId,
    bootstrapLoading,
    historyMonthsLoading,
    error,
    selectEmployee,
    prefetchSlice,
    applyMatrixUpdate,
    reload,
  };
}
