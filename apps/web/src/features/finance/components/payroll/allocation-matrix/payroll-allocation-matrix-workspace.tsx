'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState, LoadingState, ViewModeSwitch } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { PayrollAllocationMatrixGrid } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-grid';
import { PayrollAllocationMatrixManualDialog } from '@/features/finance/components/payroll/allocation-matrix/payroll-allocation-matrix-manual-dialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollAllocationMatrixApi,
  type PayrollAllocationMatrix,
  type PayrollAllocationMatrixCell,
  type PayrollMatrixViewMode,
} from '@/lib/api/payroll-allocation-matrix';

const VIEW_OPTIONS = [
  { value: 'EMPLOYEE_MATRIX' as const, label: 'By employee' },
  { value: 'ORDER_MATRIX' as const, label: 'By order' },
];

export function PayrollAllocationMatrixWorkspace({ payrollRunId }: { payrollRunId: string }) {
  const [viewMode, setViewMode] = useState<PayrollMatrixViewMode>('EMPLOYEE_MATRIX');
  const [matrix, setMatrix] = useState<PayrollAllocationMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [manualCell, setManualCell] = useState<PayrollAllocationMatrixCell | null>(null);
  const [manualBusy, setManualBusy] = useState(false);

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
      toast.success('Manual bonus created');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not create manual bonus.'));
    } finally {
      setManualBusy(false);
    }
  };

  if (loading && !matrix) return <LoadingState />;
  if (error || !matrix) {
    return <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />;
  }

  const activeUnit =
    activeColumnId != null ? matrix.deliveryUnits.find((u) => u.orderId === activeColumnId) : null;
  const activeEmployee =
    activeRowId != null ? matrix.employees.find((e) => e.employeeId === activeRowId) : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewModeSwitch
          value={viewMode}
          options={VIEW_OPTIONS}
          onChange={(next) => setViewMode(next)}
          ariaLabel="Allocation matrix view"
        />
        <div className="text-muted-foreground flex flex-wrap gap-4 text-xs tabular-nums">
          <span>Payable {formatAmount(Number.parseFloat(matrix.totals.totalPayable))}</span>
          <span>Paid {formatAmount(Number.parseFloat(matrix.totals.totalPaid))}</span>
          <span>Remaining {formatAmount(Number.parseFloat(matrix.totals.totalRemaining))}</span>
        </div>
      </div>

      {activeUnit ? (
        <div className="border-border bg-muted/20 rounded-lg border px-3 py-2 text-xs">
          <p className="font-semibold">{activeUnit.label}</p>
          <p className="text-muted-foreground tabular-nums">
            Planned {formatAmount(Number.parseFloat(activeUnit.totalPlannedBonus))} · Remaining{' '}
            {formatAmount(Number.parseFloat(activeUnit.totalRemainingBonus))} · Available{' '}
            {formatAmount(Number.parseFloat(activeUnit.availableFunding))}
          </p>
        </div>
      ) : null}

      {activeEmployee ? (
        <div className="border-border bg-muted/20 rounded-lg border px-3 py-2 text-xs">
          <p className="font-semibold">
            {activeEmployee.firstName} {activeEmployee.lastName}
          </p>
          <p className="text-muted-foreground tabular-nums">
            Fix {formatAmount(Number.parseFloat(activeEmployee.baseSalary))} · Bonus this run{' '}
            {formatAmount(Number.parseFloat(activeEmployee.bonusTotalThisRun))}
          </p>
        </div>
      ) : null}

      <PayrollAllocationMatrixGrid
        matrix={matrix}
        viewMode={viewMode}
        activeRowId={activeRowId}
        activeColumnId={activeColumnId}
        onActivateRow={setActiveRowId}
        onActivateColumn={setActiveColumnId}
        onCellClick={(cell) => {
          if (cell.state === 'UNLINKED' && matrix.editable) {
            setManualCell(cell);
            return;
          }
          if (!cell.editable) return;
          toast.message('Release editing', {
            description: `Suggested ${cell.suggestedThisMonth}, remaining ${cell.remaining}`,
          });
        }}
      />

      {loading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="size-3 animate-spin" aria-hidden />
          Refreshing…
        </p>
      ) : null}

      <PayrollAllocationMatrixManualDialog
        open={manualCell != null}
        busy={manualBusy}
        employeeLabel={
          manualCell
            ? (matrix.employees.find((e) => e.employeeId === manualCell.employeeId)?.firstName ??
              '')
            : ''
        }
        unitLabel={
          manualCell
            ? (matrix.deliveryUnits.find((u) => u.orderId === manualCell.orderId)?.label ?? '')
            : ''
        }
        onOpenChange={(open) => {
          if (!open) setManualCell(null);
        }}
        onSubmit={handleManualSubmit}
      />
    </section>
  );
}
