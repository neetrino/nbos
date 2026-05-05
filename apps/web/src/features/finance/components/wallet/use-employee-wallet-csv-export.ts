'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  downloadWalletBonusesCsv,
  downloadWalletProjectBreakdownCsv,
  downloadWalletSalaryCsv,
} from '@/features/finance/utils/export-employee-wallet-csv';
import { getApiErrorMessage } from '@/lib/api-errors';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

export function useEmployeeWalletCsvExport(snapshot: EmployeeWalletSnapshot | null) {
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [salarySubmitting, setSalarySubmitting] = useState(false);
  const [projectBreakdownSubmitting, setProjectBreakdownSubmitting] = useState(false);

  const exportBonusesCsv = useCallback(() => {
    if (!snapshot || snapshot.bonuses.length === 0) {
      toast('No bonus rows to export.');
      return;
    }
    setBonusSubmitting(true);
    try {
      downloadWalletBonusesCsv(snapshot.bonuses, { employeeId: snapshot.employee.id });
      toast.success(
        `Exported ${snapshot.bonuses.length} bonus row${snapshot.bonuses.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export wallet bonuses CSV.'));
    } finally {
      setBonusSubmitting(false);
    }
  }, [snapshot]);

  const exportSalaryCsv = useCallback(() => {
    if (!snapshot || snapshot.salaryHistory.length === 0) {
      toast('No payroll lines to export.');
      return;
    }
    setSalarySubmitting(true);
    try {
      downloadWalletSalaryCsv(snapshot.salaryHistory, { employeeId: snapshot.employee.id });
      toast.success(
        `Exported ${snapshot.salaryHistory.length} payroll line${snapshot.salaryHistory.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export wallet payroll CSV.'));
    } finally {
      setSalarySubmitting(false);
    }
  }, [snapshot]);

  const exportProjectBreakdownCsv = useCallback(() => {
    if (!snapshot || snapshot.projectBreakdown.length === 0) {
      toast('No project breakdown rows to export.');
      return;
    }
    setProjectBreakdownSubmitting(true);
    try {
      downloadWalletProjectBreakdownCsv(snapshot.projectBreakdown, {
        employeeId: snapshot.employee.id,
      });
      toast.success(
        `Exported ${snapshot.projectBreakdown.length} project row${snapshot.projectBreakdown.length === 1 ? '' : 's'}`,
      );
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not export project breakdown CSV.'));
    } finally {
      setProjectBreakdownSubmitting(false);
    }
  }, [snapshot]);

  return {
    bonusSubmitting,
    salarySubmitting,
    projectBreakdownSubmitting,
    exportBonusesCsv,
    exportSalaryCsv,
    exportProjectBreakdownCsv,
  };
}
