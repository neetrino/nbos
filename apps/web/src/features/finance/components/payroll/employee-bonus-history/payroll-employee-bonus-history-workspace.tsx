'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { PayrollEmployeeBonusHistoryGrid } from '@/features/finance/components/payroll/employee-bonus-history/payroll-employee-bonus-history-grid';
import { formatPayrollMatrixCellError } from '@/features/finance/utils/format-payroll-matrix-cell-error';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollAllocationMatrixApi } from '@/lib/api/payroll-allocation-matrix';
import {
  payrollEmployeeBonusHistoryApi,
  type PayrollEmployeeBonusHistory,
} from '@/lib/api/payroll-employee-bonus-history';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function cellKey(employeeId: string, orderId: string): string {
  return `${employeeId}:${orderId}`;
}

function historyEmployeeName(employee: { firstName: string; lastName: string }): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function PayrollEmployeeBonusHistoryWorkspace({
  payrollRunId,
  search,
  onTotalsChange,
  onSalaryLinesStale,
}: {
  payrollRunId: string;
  search: string;
  onTotalsChange?: (bonusTotal: string | null) => void;
  onSalaryLinesStale?: () => void;
}) {
  const [data, setData] = useState<PayrollEmployeeBonusHistory | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null);

  const load = useCallback(
    async (employeeId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const next = await payrollEmployeeBonusHistoryApi.get(payrollRunId, employeeId);
        setData(next);
        setSelectedEmployeeId(next.selectedEmployeeId);
      } catch (caught) {
        setData(null);
        setError(getApiErrorMessage(caught, 'Employee bonus history could not be loaded.'));
      } finally {
        setLoading(false);
      }
    },
    [payrollRunId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filteredProjects = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.projects;
    return data.projects.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.orderId.toLowerCase().includes(q),
    );
  }, [data, search]);

  const displayData = useMemo(() => {
    if (!data) return null;
    return { ...data, projects: filteredProjects };
  }, [data, filteredProjects]);

  const focusEmployee = data?.employees.find((e) => e.employeeId === selectedEmployeeId);

  useEffect(() => {
    onTotalsChange?.(focusEmployee?.bonusTotalThisRun ?? null);
    return () => onTotalsChange?.(null);
  }, [focusEmployee?.bonusTotalThisRun, onTotalsChange]);

  const handleEmployeeSelect = useCallback(
    (employeeId: string) => {
      if (employeeId === selectedEmployeeId) return;
      void load(employeeId);
    },
    [load, selectedEmployeeId],
  );

  const handleCellSave = useCallback(
    async (
      cell: NonNullable<PayrollEmployeeBonusHistory['projects'][0]['focusCell']>,
      payload: { releaseThisMonth: string; reason?: string },
    ) => {
      const key = cellKey(cell.employeeId, cell.orderId);
      setSavingCellKey(key);
      try {
        await payrollAllocationMatrixApi.patchCell(payrollRunId, {
          employeeId: cell.employeeId,
          orderId: cell.orderId,
          releaseThisMonth: payload.releaseThisMonth,
          reason: payload.reason,
        });
        await load(selectedEmployeeId ?? undefined);
        onSalaryLinesStale?.();
      } catch (caught) {
        toast.error(formatPayrollMatrixCellError(caught, 'Could not update release.'));
      } finally {
        setSavingCellKey(null);
      }
    },
    [load, onSalaryLinesStale, payrollRunId, selectedEmployeeId],
  );

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error || !data || !displayData) {
    return (
      <ErrorState
        description={error ?? 'Employee bonus history could not be loaded.'}
        onRetry={() => void load(selectedEmployeeId ?? undefined)}
      />
    );
  }

  const scrollKey = `${displayData.selectedEmployeeId}:${displayData.projects.length}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className="border-border bg-muted/20 flex gap-1 overflow-x-auto rounded-xl border p-1.5"
        role="tablist"
        aria-label="Employees"
      >
        {data.employees.map((employee) => {
          const active = employee.employeeId === selectedEmployeeId;
          return (
            <button
              key={employee.employeeId}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                'shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
              )}
              onClick={() => handleEmployeeSelect(employee.employeeId)}
            >
              <span className="block font-medium">{historyEmployeeName(employee)}</span>
              {employee.position ? (
                <span className="text-muted-foreground block max-w-[12rem] truncate text-xs">
                  {employee.position}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {displayData.projects.length === 0 ? (
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
          data={displayData}
          savingCellKey={savingCellKey}
          onCellSave={handleCellSave}
          scrollToFocusKey={scrollKey}
        />
      )}
    </div>
  );
}
