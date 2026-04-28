'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  downloadPayrollAuditTrailCsv,
  downloadPayrollJournalCsv,
} from '@/features/finance/utils/export-payroll-run-journal-audit-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { PayrollRunDetail } from '@/lib/api/payroll-runs';

export function usePayrollRunJournalAuditCsvExport(run: PayrollRunDetail | null) {
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
      toast.success(
        `Exported ${run.journal.length} journal row${run.journal.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export journal CSV.'));
    } finally {
      setJournalSubmitting(false);
    }
  }, [run]);

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
      toast.success(
        `Exported ${run.auditTrail.length} audit row${run.auditTrail.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export audit trail CSV.'));
    } finally {
      setAuditSubmitting(false);
    }
  }, [run]);

  return {
    journalSubmitting,
    auditSubmitting,
    handleExportJournalCsv,
    handleExportAuditCsv,
  };
}
