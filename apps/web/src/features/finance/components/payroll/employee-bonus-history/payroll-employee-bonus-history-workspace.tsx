'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { PayrollEmployeeBonusHistoryGrid } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-grid';
import {
  buildOptimisticEmployeeBonusHistory,
  mergeEmployeeBonusHistorySlice,
} from '@/features/finance/utils/build-employee-bonus-history-view';
import { formatPayrollMatrixCellError } from '@/features/finance/utils/format-payroll-matrix-cell-error';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function cellKey(employeeId: string, orderId: string): string {
  return `${employeeId}:${orderId}`;
}

function historyEmployeeName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

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

export function PayrollEmployeeBonusHistoryWorkspace({
  payrollRunId,
  search,
  sharedMeta = null,
  sharedEmployeeMatrix = null,
  onSharedMatrixChange,
  sharedMetaError = null,
  onTotalsChange,
  onSalaryLinesStale,
}: {
  payrollRunId: string;
  search: string;
  sharedMeta?: PayrollEmployeeBonusHistoryMeta | null;
  sharedEmployeeMatrix?: PayrollAllocationMatrix | null;
  onSharedMatrixChange?: (matrix: PayrollAllocationMatrix) => void;
  sharedMetaError?: string | null;
  onTotalsChange?: (bonusTotal: string | null) => void;
  onSalaryLinesStale?: () => void;
}) {
  const [meta, setMeta] = useState<PayrollEmployeeBonusHistoryMeta | null>(null);
  const [matrix, setMatrix] = useState<PayrollAllocationMatrix | null>(null);
  const [displayData, setDisplayData] = useState<PayrollEmployeeBonusHistory | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [historyMonthsLoading, setHistoryMonthsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);

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
      const cached = sliceCacheRef.current.get(employeeId);
      if (cached) {
        const optimistic = buildOptimisticEmployeeBonusHistory(
          metaSnapshot,
          matrixSnapshot,
          employeeId,
        );
        setDisplayData(mergeEmployeeBonusHistorySlice(optimistic, cached, matrixSnapshot));
        return;
      }

      const requestId = sliceRequestRef.current + 1;
      sliceRequestRef.current = requestId;
      if (showHistoryLoading) {
        setHistoryMonthsLoading(true);
      }

      try {
        const slice = await payrollEmployeeBonusHistoryApi.getSlice(payrollRunId, employeeId);
        if (sliceRequestRef.current !== requestId) return;
        sliceCacheRef.current.set(employeeId, slice);
        const optimistic = buildOptimisticEmployeeBonusHistory(
          metaSnapshot,
          matrixSnapshot,
          employeeId,
        );
        setDisplayData(mergeEmployeeBonusHistorySlice(optimistic, slice, matrixSnapshot));
      } catch (caught) {
        if (sliceRequestRef.current !== requestId) return;
        toast.error(getApiErrorMessage(caught, 'Bonus history could not be loaded.'));
      } finally {
        if (sliceRequestRef.current === requestId) {
          setHistoryMonthsLoading(false);
        }
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
      if (firstId) {
        const optimistic = buildOptimisticEmployeeBonusHistory(metaResult, matrixResult, firstId);
        setDisplayData(optimistic);
        void loadSlice(firstId, metaResult, matrixResult, true);
      } else {
        setDisplayData(null);
      }
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

    const optimistic = buildOptimisticEmployeeBonusHistory(
      meta,
      sharedEmployeeMatrix,
      selectedEmployeeId,
    );
    setDisplayData(optimistic);
    void loadSlice(selectedEmployeeId, meta, sharedEmployeeMatrix, true);
  }, [loadSlice, matrix, meta, payrollRunId, selectedEmployeeId, sharedEmployeeMatrix]);

  const handleEmployeeSelect = useCallback(
    (employeeId: string) => {
      if (!meta || !matrix || employeeId === selectedEmployeeId) return;

      setSelectedEmployeeId(employeeId);
      const optimistic = buildOptimisticEmployeeBonusHistory(meta, matrix, employeeId);
      setDisplayData(optimistic);
      void loadSlice(employeeId, meta, matrix, !sliceCacheRef.current.has(employeeId));
    },
    [loadSlice, matrix, meta, selectedEmployeeId],
  );

  const filteredProjects = useMemo(() => {
    if (!displayData) return [];
    const q = search.trim().toLowerCase();
    if (!q) return displayData.projects;
    return displayData.projects.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.orderId.toLowerCase().includes(q),
    );
  }, [displayData, search]);

  const gridData = useMemo(() => {
    if (!displayData) return null;
    return { ...displayData, projects: filteredProjects };
  }, [displayData, filteredProjects]);

  const focusEmployee = meta?.employees.find((e) => e.employeeId === selectedEmployeeId);

  useEffect(() => {
    onTotalsChange?.(focusEmployee?.bonusTotalThisRun ?? null);
    return () => onTotalsChange?.(null);
  }, [focusEmployee?.bonusTotalThisRun, onTotalsChange]);

  const handleCellSave = useCallback(
    async (
      cell: NonNullable<PayrollEmployeeBonusHistory['projects'][0]['focusCell']>,
      payload: { releaseThisMonth: string; reason?: string },
    ) => {
      if (!meta || !matrix || !selectedEmployeeId) return;

      const key = cellKey(cell.employeeId, cell.orderId);
      setSavingCellKey(key);
      try {
        const updatedMatrix = await payrollAllocationMatrixApi.patchCell(payrollRunId, {
          employeeId: cell.employeeId,
          orderId: cell.orderId,
          releaseThisMonth: payload.releaseThisMonth,
          reason: payload.reason,
        });
        setMatrix(updatedMatrix);
        onSharedMatrixChange?.(updatedMatrix);
        sliceCacheRef.current.delete(selectedEmployeeId);
        const optimistic = buildOptimisticEmployeeBonusHistory(
          meta,
          updatedMatrix,
          selectedEmployeeId,
        );
        setDisplayData(optimistic);
        void loadSlice(selectedEmployeeId, meta, updatedMatrix, true);
        onSalaryLinesStale?.();
      } catch (caught) {
        toast.error(formatPayrollMatrixCellError(caught, 'Could not update release.'));
      } finally {
        setSavingCellKey(null);
      }
    },
    [
      loadSlice,
      matrix,
      meta,
      onSalaryLinesStale,
      onSharedMatrixChange,
      payrollRunId,
      selectedEmployeeId,
    ],
  );

  if (bootstrapLoading && !displayData) {
    return <LoadingState />;
  }

  if (error || !meta || !matrix || !gridData) {
    return (
      <ErrorState
        description={error ?? sharedMetaError ?? 'Employee bonus history could not be loaded.'}
        onRetry={() => {
          initializedRunIdRef.current = null;
          void initialize();
        }}
      />
    );
  }

  const scrollKey = `${gridData.selectedEmployeeId}:${gridData.projects.length}:${historyMonthsLoading}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className="border-border bg-muted/20 flex gap-1 overflow-x-auto rounded-xl border p-1.5"
        role="tablist"
        aria-label="Employees"
      >
        {meta.employees.map((employee) => {
          const active = employee.employeeId === selectedEmployeeId;
          return (
            <button
              key={employee.employeeId}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:border-border hover:bg-card/80 hover:text-foreground border-transparent',
              )}
              onClick={() => handleEmployeeSelect(employee.employeeId)}
              onMouseEnter={() => {
                if (
                  employee.employeeId !== selectedEmployeeId &&
                  !sliceCacheRef.current.has(employee.employeeId)
                ) {
                  void loadSlice(employee.employeeId, meta, matrix, false);
                }
              }}
            >
              <span className="block font-semibold">{historyEmployeeName(employee)}</span>
              {employee.position ? (
                <span
                  className={cn(
                    'block max-w-[12rem] truncate text-xs',
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {employee.position}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {gridData.projects.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No projects"
          description={
            search.trim()
              ? 'No projects match your search for this employee.'
              : 'This employee has no bonus history in the last 12 months on visible projects.'
          }
        />
      ) : (
        <PayrollEmployeeBonusHistoryGrid
          data={gridData}
          savingCellKey={savingCellKey}
          historyMonthsLoading={historyMonthsLoading}
          onCellSave={handleCellSave}
          scrollToFocusKey={scrollKey}
        />
      )}
    </div>
  );
}
