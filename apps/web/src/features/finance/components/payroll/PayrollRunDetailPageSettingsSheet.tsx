'use client';

import { BookOpen, ClipboardList, Download, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import type { PayrollRunDetail } from '@/lib/api/payroll-runs';

export interface PayrollRunDetailPageSettingsSheetProps {
  run: PayrollRunDetail;
  onRefresh: () => void;
  salaryExportSubmitting: boolean;
  onExportSalaryLines: () => void;
  journalSubmitting: boolean;
  onExportJournal: () => void;
  auditSubmitting: boolean;
  onExportAudit: () => void;
}

export function PayrollRunDetailPageSettingsSheet({
  run,
  onRefresh,
  salaryExportSubmitting,
  onExportSalaryLines,
  journalSubmitting,
  onExportJournal,
  auditSubmitting,
  onExportAudit,
}: PayrollRunDetailPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Payroll run — settings"
      description="Refresh data and export run artifacts."
      triggerAriaLabel="Payroll run settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        onClick={() => void onRefresh()}
      >
        <RefreshCcw className="size-4 shrink-0" aria-hidden />
        Refresh run
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={salaryExportSubmitting || run.salaryLines.length === 0}
        onClick={() => onExportSalaryLines()}
      >
        {salaryExportSubmitting ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4 shrink-0" aria-hidden />
        )}
        Export salary lines (CSV)
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={journalSubmitting || run.journal.length === 0}
        onClick={() => onExportJournal()}
      >
        {journalSubmitting ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <BookOpen className="size-4 shrink-0" aria-hidden />
        )}
        Export run journal (CSV)
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={auditSubmitting || run.auditTrail.length === 0}
        onClick={() => onExportAudit()}
      >
        {auditSubmitting ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <ClipboardList className="size-4 shrink-0" aria-hidden />
        )}
        Export audit trail (CSV)
      </Button>
    </PageSettingsSheet>
  );
}
