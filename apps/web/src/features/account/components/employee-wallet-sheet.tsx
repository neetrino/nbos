'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent, ErrorState, LoadingState } from '@/components/shared';
import { EmployeeWalletSheetBody } from '@/features/account/components/employee-wallet-sheet-body';
import { EmployeeMonthCompensationSheet } from '@/features/finance/components/payroll/employee-month-compensation-sheet';
import { buildSalaryLineMonthDetailFromWalletRow } from '@/features/finance/utils/salary-line-month-detail-placeholder';
import { useEmployeeWalletCsvExport } from '@/features/finance/components/wallet/use-employee-wallet-csv-export';
import { getApiErrorMessage } from '@/lib/api-errors';
import { meApi, type EmployeeWalletNextPayroll, type EmployeeWalletSnapshot } from '@/lib/api/me';

function walletNextPayrollAsSalaryRow(nextPayroll: EmployeeWalletNextPayroll) {
  return {
    id: nextPayroll.salaryLineId,
    payrollRunId: nextPayroll.payrollRunId,
    payrollMonth: nextPayroll.payrollMonth,
    payoutPhase: 'active_payout' as const,
    runStatus: nextPayroll.runStatus,
    baseSalary: nextPayroll.baseSalary,
    bonusesTotal: nextPayroll.bonusesTotal,
    totalPayable: nextPayroll.totalPayable,
    paidAmount: nextPayroll.paidAmount,
    remainingAmount: nextPayroll.remainingAmount,
    lineStatus: nextPayroll.lineStatus,
    expenseId: nextPayroll.expenseId,
  };
}

function salaryLineInWallet(data: EmployeeWalletSnapshot, salaryLineId: string): boolean {
  if (data.nextPayroll?.salaryLineId === salaryLineId) {
    return true;
  }
  return data.salaryHistory.some((row) => row.id === salaryLineId);
}

interface EmployeeWalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deepLinkHref: string;
  initialSalaryLineId?: string | null;
}

export function EmployeeWalletSheet({
  open,
  onOpenChange,
  deepLinkHref,
  initialSalaryLineId = null,
}: EmployeeWalletSheetProps) {
  const [data, setData] = useState<EmployeeWalletSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSalaryLineId, setOpenSalaryLineId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await meApi.getWallet();
      setData(snap);
      return snap;
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Wallet could not be loaded.'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setOpenSalaryLineId(null);
      return;
    }
    void load();
    if (initialSalaryLineId) {
      setOpenSalaryLineId(initialSalaryLineId);
    }
  }, [initialSalaryLineId, load, open]);

  useEffect(() => {
    if (!open || loading || !openSalaryLineId || !data) return;
    if (!salaryLineInWallet(data, openSalaryLineId)) {
      setOpenSalaryLineId(null);
    }
  }, [data, loading, open, openSalaryLineId]);

  const {
    bonusSubmitting,
    salarySubmitting,
    projectBreakdownSubmitting,
    exportBonusesCsv,
    exportSalaryCsv,
    exportProjectBreakdownCsv,
  } = useEmployeeWalletCsvExport(data);

  const monthSheetOpen = Boolean(openSalaryLineId);

  const initialMonthDetail = useMemo(() => {
    if (!openSalaryLineId || !data) return null;
    if (data.nextPayroll?.salaryLineId === openSalaryLineId) {
      return buildSalaryLineMonthDetailFromWalletRow(
        walletNextPayrollAsSalaryRow(data.nextPayroll),
        data.employee,
      );
    }
    const row = data.salaryHistory.find((historyRow) => historyRow.id === openSalaryLineId);
    return row ? buildSalaryLineMonthDetailFromWalletRow(row, data.employee) : null;
  }, [data, openSalaryLineId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="wide"
        sourcePageHref={deepLinkHref}
      >
        <div className="flex h-full min-h-0 flex-col">
          {loading ? (
            <div className="p-6">
              <LoadingState />
            </div>
          ) : error || !data ? (
            <div className="p-6">
              <ErrorState description={error ?? 'Unavailable'} onRetry={() => void load()} />
            </div>
          ) : (
            <EmployeeWalletSheetBody
              data={data}
              openSalaryLineId={openSalaryLineId}
              onOpenMonth={setOpenSalaryLineId}
              bonusSubmitting={bonusSubmitting}
              salarySubmitting={salarySubmitting}
              projectBreakdownSubmitting={projectBreakdownSubmitting}
              onExportBonusesCsv={() => exportBonusesCsv()}
              onExportSalaryCsv={() => exportSalaryCsv()}
              onExportProjectBreakdownCsv={() => exportProjectBreakdownCsv()}
            />
          )}
        </div>
      </EntityDetailSheetContent>

      <EmployeeMonthCompensationSheet
        salaryLineId={openSalaryLineId}
        open={monthSheetOpen}
        onOpenChange={(next) => {
          if (!next) setOpenSalaryLineId(null);
        }}
        initialDetail={initialMonthDetail}
        readOnly
        detailScope="wallet"
      />
    </Sheet>
  );
}
