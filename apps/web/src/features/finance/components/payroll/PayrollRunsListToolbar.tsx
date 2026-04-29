'use client';

import { Download, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunStatus } from '@/lib/api/payroll-runs';

const STATUS_OPTIONS: PayrollRunStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'PAYING', 'CLOSED'];

const PAYROLL_LIST_TOOLBAR_CONTROL_CLASS =
  'border-input bg-card text-foreground focus:ring-ring h-9 rounded-md border px-2 text-sm focus:ring-2 focus:outline-none';

export function PayrollRunsListToolbar(props: {
  statusFilter: PayrollRunStatus | 'ALL';
  onStatusChange: (value: string) => void;
  monthFrom?: string;
  monthTo?: string;
  onMonthFromChange: (value: string) => void;
  onMonthToChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
  exportCsvSubmitting: boolean;
  onExportCsv: () => void;
  onNewRun: () => void;
}) {
  const {
    statusFilter,
    onStatusChange,
    monthFrom,
    monthTo,
    onMonthFromChange,
    onMonthToChange,
    onRefresh,
    loading,
    exportCsvSubmitting,
    onExportCsv,
    onNewRun,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by run status"
          className={`${PAYROLL_LIST_TOOLBAR_CONTROL_CLASS} px-3`}
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {PAYROLL_RUN_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground text-xs whitespace-nowrap">From</span>
        <input
          id="payroll-scope-month-from"
          type="month"
          aria-label="Lower bound payroll month YYYY-MM"
          className={PAYROLL_LIST_TOOLBAR_CONTROL_CLASS}
          value={monthFrom ?? ''}
          onChange={(e) => onMonthFromChange(e.target.value)}
        />
        <span className="text-muted-foreground text-xs whitespace-nowrap">To</span>
        <input
          id="payroll-scope-month-to"
          type="month"
          aria-label="Upper bound payroll month YYYY-MM"
          className={PAYROLL_LIST_TOOLBAR_CONTROL_CLASS}
          value={monthTo ?? ''}
          onChange={(e) => onMonthToChange(e.target.value)}
        />
      </div>
      <Button variant="outline" size="icon" onClick={() => void onRefresh()} aria-label="Refresh">
        <RefreshCcw size={16} />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={loading || exportCsvSubmitting}
        onClick={() => {
          void onExportCsv();
        }}
        aria-label="Export payroll runs as CSV"
        title="UTF-8 CSV of all runs matching current filters (per-run totalRemaining plus a final grand-total row)"
      >
        {exportCsvSubmitting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
      </Button>
      <Button onClick={onNewRun}>
        <Plus size={16} className="mr-1.5" />
        New run
      </Button>
    </div>
  );
}
