'use client';

import { BookOpen, ClipboardList, Download, LayoutGrid, Loader2, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  resetLayoutDisabled: boolean;
  onResetLayout: () => void;
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
  resetLayoutDisabled,
  onResetLayout,
}: PayrollRunDetailPageSettingsSheetProps) {
  const t = useTranslations('payroll');
  return (
    <PageSettingsSheet
      title={t('detail.settingsTitle')}
      description={t('detail.settingsDescription')}
      triggerAriaLabel={t('detail.settingsAria')}
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        onClick={() => void onRefresh()}
      >
        <RefreshCcw className="size-4 shrink-0" aria-hidden />
        {t('detail.refresh')}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={resetLayoutDisabled}
        onClick={() => onResetLayout()}
      >
        <LayoutGrid className="size-4 shrink-0" aria-hidden />
        {t('detail.resetLayout')}
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
        {t('detail.exportLines')}
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
        {t('detail.exportJournal')}
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
        {t('detail.exportAudit')}
      </Button>
    </PageSettingsSheet>
  );
}
