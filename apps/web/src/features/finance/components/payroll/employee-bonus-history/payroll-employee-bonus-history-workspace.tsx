'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { PayrollEmployeeBonusHistoryGrid } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-grid';
import { PayrollEmployeeBonusHistoryTabs } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-tabs';
import { usePayrollEmployeeBonusHistoryData } from '@/features/finance/components/payroll/employee-bonus-history/use-payroll-employee-bonus-history-data';
import { PayrollAllocationMatrixManualDialog } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-manual-dialog';
import { formatPayrollMatrixCellError } from '@/features/finance/utils/format-payroll-matrix-cell-error';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollAllocationMatrixApi,
  type PayrollAllocationMatrix,
  type PayrollAllocationMatrixCell,
} from '@/lib/api/payroll-allocation-matrix';
import type { PayrollEmployeeBonusHistoryMeta } from '@/lib/api/payroll-employee-bonus-history';
import { toast } from 'sonner';

function cellKey(employeeId: string, orderId: string): string {
  return `${employeeId}:${orderId}`;
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
  const {
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
  } = usePayrollEmployeeBonusHistoryData({
    payrollRunId,
    sharedMeta,
    sharedEmployeeMatrix,
    onSharedMatrixChange,
    sharedMetaError,
  });

  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);
  const [manualCell, setManualCell] = useState<PayrollAllocationMatrixCell | null>(null);
  const [manualBusy, setManualBusy] = useState(false);

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
      cell: PayrollAllocationMatrixCell,
      payload: { releaseThisMonth: string; reason?: string },
    ) => {
      const key = cellKey(cell.employeeId, cell.orderId);
      setSavingCellKey(key);
      try {
        const updated = await payrollAllocationMatrixApi.patchCell(payrollRunId, {
          employeeId: cell.employeeId,
          orderId: cell.orderId,
          releaseThisMonth: payload.releaseThisMonth,
          reason: payload.reason,
        });
        applyMatrixUpdate(updated);
        onSalaryLinesStale?.();
      } catch (caught) {
        toast.error(formatPayrollMatrixCellError(caught, 'Could not update release.'));
      } finally {
        setSavingCellKey(null);
      }
    },
    [applyMatrixUpdate, onSalaryLinesStale, payrollRunId],
  );

  const handleManualSubmit = useCallback(
    async (payload: { title: string; amount: string; reason: string }) => {
      if (!manualCell) return;
      setManualBusy(true);
      try {
        const updated = await payrollAllocationMatrixApi.createManualBonus(payrollRunId, {
          employeeId: manualCell.employeeId,
          orderId: manualCell.orderId,
          ...payload,
        });
        applyMatrixUpdate(updated);
        setManualCell(null);
        onSalaryLinesStale?.();
        toast.success('Manual bonus created and attached');
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not create manual bonus.'));
      } finally {
        setManualBusy(false);
      }
    },
    [applyMatrixUpdate, manualCell, onSalaryLinesStale, payrollRunId],
  );

  if (bootstrapLoading && !displayData) {
    return <LoadingState />;
  }

  if (error || !meta || !matrix || !gridData) {
    return (
      <ErrorState
        description={error ?? sharedMetaError ?? 'Employee bonus history could not be loaded.'}
        onRetry={reload}
      />
    );
  }

  const scrollKey = `${gridData.selectedEmployeeId}:${gridData.projects.length}:${historyMonthsLoading}`;
  const employeeLabel = focusEmployee
    ? `${focusEmployee.firstName} ${focusEmployee.lastName}`.trim()
    : '';
  const manualUnitLabel = manualCell
    ? (meta.deliveryUnits.find((u) => u.orderId === manualCell.orderId)?.label ??
      manualCell.orderId)
    : '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <PayrollEmployeeBonusHistoryTabs
        employees={meta.employees}
        selectedEmployeeId={selectedEmployeeId}
        onSelect={selectEmployee}
        onPrefetch={prefetchSlice}
      />

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
          onManualBonus={setManualCell}
          scrollToFocusKey={scrollKey}
        />
      )}

      <PayrollAllocationMatrixManualDialog
        open={manualCell != null}
        busy={manualBusy}
        employeeLabel={employeeLabel}
        unitLabel={manualUnitLabel}
        onOpenChange={(open) => {
          if (!open) setManualCell(null);
        }}
        onSubmit={handleManualSubmit}
      />
    </div>
  );
}
