'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { filterPayrollAllocationMatrix } from '@/features/finance/components/payroll/allocation-matrix/filter-payroll-allocation-matrix';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState, LoadingState } from '@/components/shared';
import { PayrollAllocationMatrixGrid } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-grid';
import { PayrollAllocationMatrixManualDialog } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-manual-dialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PayrollMatrixLayoutHeroActions } from '@/features/finance/components/payroll/allocation-matrix/payroll-matrix-layout-hero-actions';
import {
  payrollAllocationMatrixApi,
  type PayrollAllocationMatrix,
  type PayrollAllocationMatrixCell,
  type PayrollMatrixValidationIssue,
  type PayrollMatrixViewMode,
} from '@/lib/api/payroll-allocation-matrix';

function matrixCellKey(cell: PayrollAllocationMatrixCell): string {
  return `${cell.employeeId}:${cell.orderId}`;
}

export function PayrollAllocationMatrixWorkspace({
  payrollRunId,
  viewMode,
  search,
  fullscreen = false,
  onTotalsChange,
  onLayoutHeroActionsChange,
}: {
  payrollRunId: string;
  viewMode: PayrollMatrixViewMode;
  search: string;
  fullscreen?: boolean;
  onTotalsChange?: (totals: PayrollAllocationMatrix['totals'] | null) => void;
  onLayoutHeroActionsChange?: (actions: PayrollMatrixLayoutHeroActions | null) => void;
}) {
  const [matrix, setMatrix] = useState<PayrollAllocationMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  /** Column and row expansion are mutually exclusive — one detail view at a time. */
  const handleActivateColumn = useCallback((columnId: string | null) => {
    setActiveRowId(null);
    setActiveColumnId(columnId);
  }, []);

  const handleActivateRow = useCallback((rowId: string | null) => {
    setActiveColumnId(null);
    setActiveRowId(rowId);
  }, []);

  const [manualCell, setManualCell] = useState<PayrollAllocationMatrixCell | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<PayrollMatrixValidationIssue[]>([]);
  const [layoutBusy, setLayoutBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await payrollAllocationMatrixApi.get(payrollRunId, viewMode);
      setMatrix(data);
    } catch (caught) {
      setMatrix(null);
      setError(getApiErrorMessage(caught, 'Allocation matrix could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [payrollRunId, viewMode]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    onTotalsChange?.(matrix?.totals ?? null);
    return () => onTotalsChange?.(null);
  }, [matrix?.totals, onTotalsChange]);

  useEffect(() => {
    setActiveRowId(null);
    setActiveColumnId(null);
  }, [viewMode, search]);

  const displayMatrix = useMemo(() => {
    if (!matrix) return null;
    return filterPayrollAllocationMatrix(matrix, search);
  }, [matrix, search]);

  const refreshValidation = useCallback(async () => {
    if (!matrix?.editable) {
      setValidationIssues([]);
      return;
    }
    try {
      const { issues } = await payrollAllocationMatrixApi.getValidation(payrollRunId);
      setValidationIssues(issues);
    } catch {
      setValidationIssues([]);
    }
  }, [matrix?.editable, payrollRunId]);

  useEffect(() => {
    void refreshValidation();
  }, [refreshValidation, matrix]);

  const persistLayout = async (patch: {
    rowOrder?: string[];
    columnOrder?: string[];
    pinnedUnitIds?: string[];
  }) => {
    if (!matrix) return;
    setLayoutBusy(true);
    try {
      const updated = await payrollAllocationMatrixApi.patchLayout(payrollRunId, {
        viewMode,
        rowOrder: patch.rowOrder ?? matrix.layout.rowOrder,
        columnOrder: patch.columnOrder ?? matrix.layout.columnOrder,
        pinnedUnitIds: patch.pinnedUnitIds ?? matrix.layout.pinnedUnitIds,
      });
      setMatrix(updated);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Layout could not be saved.'));
    } finally {
      setLayoutBusy(false);
    }
  };

  const handleManualSubmit = async (payload: { title: string; amount: string; reason: string }) => {
    if (!manualCell) return;
    setManualBusy(true);
    try {
      const updated = await payrollAllocationMatrixApi.createManualBonus(payrollRunId, {
        employeeId: manualCell.employeeId,
        orderId: manualCell.orderId,
        ...payload,
      });
      setMatrix(updated);
      setManualCell(null);
      toast.success('Manual bonus created and attached');
      void refreshValidation();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not create manual bonus.'));
    } finally {
      setManualBusy(false);
    }
  };

  const handleReleaseSave = useCallback(
    async (
      cell: PayrollAllocationMatrixCell,
      payload: { releaseThisMonth: string; reason?: string },
    ) => {
      const key = matrixCellKey(cell);
      setSavingCellKey(key);
      try {
        const updated = await payrollAllocationMatrixApi.patchCell(payrollRunId, {
          employeeId: cell.employeeId,
          orderId: cell.orderId,
          releaseThisMonth: payload.releaseThisMonth,
          reason: payload.reason,
        });
        setMatrix(updated);
        void refreshValidation();
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not update release.'));
        throw caught;
      } finally {
        setSavingCellKey(null);
      }
    },
    [payrollRunId, refreshValidation],
  );

  const handleResetLayout = useCallback(() => {
    void (async () => {
      setLayoutBusy(true);
      try {
        const updated = await payrollAllocationMatrixApi.resetLayout(payrollRunId, viewMode);
        setMatrix(updated);
        setActiveRowId(null);
        setActiveColumnId(null);
        toast.success('Layout reset');
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Layout could not be reset.'));
      } finally {
        setLayoutBusy(false);
      }
    })();
  }, [payrollRunId, viewMode]);

  const layoutDisabled = !matrix?.editable || layoutBusy;

  useEffect(() => {
    if (!matrix) {
      onLayoutHeroActionsChange?.(null);
      return;
    }
    onLayoutHeroActionsChange?.({
      resetDisabled: layoutDisabled,
      onResetLayout: handleResetLayout,
    });
    return () => onLayoutHeroActionsChange?.(null);
  }, [handleResetLayout, layoutDisabled, matrix, onLayoutHeroActionsChange]);

  if (loading && !matrix) return <LoadingState />;
  if (error || !matrix || !displayMatrix) {
    return <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />;
  }

  const employeeLabel = (id: string) => {
    const e = matrix.employees.find((x) => x.employeeId === id);
    return e ? `${e.firstName} ${e.lastName}`.trim() : id;
  };
  const unitLabel = (id: string) => matrix.deliveryUnits.find((u) => u.orderId === id)?.label ?? id;

  return (
    <section
      className={cn(
        'bg-card flex min-h-0 flex-1 flex-col overflow-hidden',
        fullscreen ? 'h-full rounded-lg' : 'rounded-xl',
      )}
    >
      {validationIssues.length > 0 ? (
        <div
          className="border-destructive/40 bg-destructive/5 text-destructive border-b px-4 py-2 text-xs"
          role="alert"
        >
          <p className="font-semibold">Resolve before review/approval</p>
          <ul className="mt-1 list-inside list-disc">
            {validationIssues.map((issue) => (
              <li key={`${issue.code}-${issue.releaseId ?? issue.employeeId ?? issue.message}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {displayMatrix.employees.length === 0 && displayMatrix.deliveryUnits.length === 0 ? (
        <p className="text-muted-foreground min-h-0 flex-1 px-2 py-8 text-center text-sm">
          No rows match this search. Clear the search bar to see the full matrix.
        </p>
      ) : (
        <PayrollAllocationMatrixGrid
          matrix={displayMatrix}
          viewMode={viewMode}
          fullscreen={fullscreen}
          pinnedUnitIds={matrix.layout.pinnedUnitIds}
          layoutDisabled={layoutDisabled}
          activeRowId={activeRowId}
          activeColumnId={activeColumnId}
          savingCellKey={savingCellKey}
          onActivateRow={handleActivateRow}
          onActivateColumn={handleActivateColumn}
          onReorderColumns={(orderedIds) => {
            if (viewMode === 'EMPLOYEE_MATRIX') {
              void persistLayout({ columnOrder: orderedIds });
            } else {
              void persistLayout({ rowOrder: orderedIds });
            }
          }}
          onReorderRows={(orderedIds) => {
            if (viewMode === 'EMPLOYEE_MATRIX') {
              void persistLayout({ rowOrder: orderedIds });
            } else {
              void persistLayout({ columnOrder: orderedIds });
            }
          }}
          onManualCellRequest={setManualCell}
          onReleaseSave={handleReleaseSave}
        />
      )}

      {loading || layoutBusy ? (
        <p className="text-muted-foreground border-border flex items-center gap-2 border-t px-4 py-2 text-xs">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Updating…
        </p>
      ) : null}

      <PayrollAllocationMatrixManualDialog
        open={manualCell != null}
        busy={manualBusy}
        employeeLabel={manualCell ? employeeLabel(manualCell.employeeId) : ''}
        unitLabel={manualCell ? unitLabel(manualCell.orderId) : ''}
        onOpenChange={(open) => {
          if (!open) setManualCell(null);
        }}
        onSubmit={handleManualSubmit}
      />
    </section>
  );
}
