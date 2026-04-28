'use client';

import { BookOpen, ClipboardList, Download, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { payrollRunActionOptions } from '@/features/finance/constants/payroll-run-ui';
import type { PayrollRunDetail, PayrollRunStatus } from '@/lib/api/payroll-runs';

export function PayrollRunDetailActions(props: {
  run: PayrollRunDetail;
  onRefresh: () => void;
  salaryExportSubmitting: boolean;
  onExportSalaryLines: () => void;
  journalSubmitting: boolean;
  onExportJournal: () => void;
  auditSubmitting: boolean;
  onExportAudit: () => void;
  statusBusy: boolean;
  onApplyStatus: (next: PayrollRunStatus) => void;
}) {
  const {
    run,
    onRefresh,
    salaryExportSubmitting,
    onExportSalaryLines,
    journalSubmitting,
    onExportJournal,
    auditSubmitting,
    onExportAudit,
    statusBusy,
    onApplyStatus,
  } = props;

  const actions = payrollRunActionOptions(run.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => void onRefresh()} aria-label="Refresh">
        <RefreshCcw size={16} />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={salaryExportSubmitting || run.salaryLines.length === 0}
        onClick={() => onExportSalaryLines()}
        aria-label="Export salary lines as CSV"
        title="Salary lines (UTF-8 CSV)"
      >
        {salaryExportSubmitting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={journalSubmitting || run.journal.length === 0}
        onClick={() => onExportJournal()}
        aria-label="Export run journal as CSV"
        title="Run journal milestones (UTF-8 CSV)"
      >
        {journalSubmitting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <BookOpen size={16} aria-hidden />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={auditSubmitting || run.auditTrail.length === 0}
        onClick={() => onExportAudit()}
        aria-label="Export audit trail as CSV"
        title="Audit trail from NBOS audit storage (UTF-8 CSV)"
      >
        {auditSubmitting ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <ClipboardList size={16} aria-hidden />
        )}
      </Button>
      {actions.map((a) => (
        <Button
          key={a.to}
          type="button"
          variant={a.to === 'DRAFT' ? 'outline' : 'default'}
          disabled={statusBusy}
          onClick={() => void onApplyStatus(a.to)}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
