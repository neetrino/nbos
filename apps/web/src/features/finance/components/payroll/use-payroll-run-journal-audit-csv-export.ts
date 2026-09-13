'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  downloadPayrollAuditTrailCsv,
  downloadPayrollJournalCsv,
} from '@/features/finance/utils/export-payroll-run-journal-audit-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PayrollRunDetail } from '@/lib/api/payroll-runs';

export function usePayrollRunJournalAuditCsvExport(run: PayrollRunDetail | null) {
  const t = useTranslations('payroll');
  const [journalSubmitting, setJournalSubmitting] = useState(false);
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  const handleExportJournalCsv = useCallback(() => {
    if (!run || run.journal.length === 0) {
      return;
    }
    setJournalSubmitting(true);
    try {
      downloadPayrollJournalCsv(run.journal, {
        payrollRunId: run.id,
        payrollMonth: run.payrollMonth,
      });
      toast.success(t('audit.exportJournalSuccess', { count: run.journal.length }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('audit.exportJournalError')));
    } finally {
      setJournalSubmitting(false);
    }
  }, [run, t]);

  const handleExportAuditCsv = useCallback(() => {
    if (!run || run.auditTrail.length === 0) {
      return;
    }
    setAuditSubmitting(true);
    try {
      downloadPayrollAuditTrailCsv(run.auditTrail, {
        payrollRunId: run.id,
        payrollMonth: run.payrollMonth,
      });
      toast.success(t('audit.exportAuditSuccess', { count: run.auditTrail.length }));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('audit.exportAuditError')));
    } finally {
      setAuditSubmitting(false);
    }
  }, [run, t]);

  return {
    journalSubmitting,
    auditSubmitting,
    handleExportJournalCsv,
    handleExportAuditCsv,
  };
}
