'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Banknote, Loader2 } from 'lucide-react';
import {
  DetailSheetSection,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  StatusBadge,
} from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import { expensesPayrollPresetHref } from '@/features/finance/constants/expense-payroll-filter';
import { EmployeeMonthCompensationKpiSection } from '@/features/finance/components/payroll/employee-month-compensation-kpi-section';
import { EmployeeMonthCompensationKpiSummaryLine } from '@/features/finance/components/payroll/employee-month-compensation-kpi-summary-line';
import { EmployeeMonthCompensationSummary } from '@/features/finance/components/payroll/employee-month-compensation-summary';
import { SalaryMonthBonusBreakdown } from '@/features/finance/components/payroll/salary-month-bonus-breakdown';
import { WalletMonthSheetHints } from '@/features/finance/components/payroll/wallet-month-sheet-hints';
import {
  useSalaryLineMonthDetail,
  type SalaryLineMonthDetailScope,
} from '@/features/finance/components/payroll/use-salary-line-month-detail';
import type { ExpenseLedgerPaymentStatus } from '@/lib/api/finance';
import type { SalaryLineMonthDetail } from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatPaymentDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function employeeName(detail: SalaryLineMonthDetail): string {
  return `${detail.employee.firstName} ${detail.employee.lastName}`.trim();
}

function ExpensePaymentsSection({
  detail,
  readOnly,
}: {
  detail: SalaryLineMonthDetail;
  readOnly: boolean;
}) {
  const expense = detail.expense;
  if (!expense) {
    return (
      <p className="text-muted-foreground text-sm">
        No expense card yet. Materializes when the payroll run is approved.
      </p>
    );
  }

  const ledgerPresentation = expenseLedgerPaymentStatusPresentation(
    expense.paymentStatus as ExpenseLedgerPaymentStatus,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge label={ledgerPresentation.label} variant={ledgerPresentation.variant} />
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatAmount(parseAmount(expense.paidAmount))} /{' '}
          {formatAmount(parseAmount(expense.amount))}
        </span>
        {readOnly ? null : (
          <>
            <Link
              href={`/finance/expenses/${expense.id}`}
              className="text-primary text-sm hover:underline"
            >
              Open expense card
            </Link>
            <Link
              href={expensesPayrollPresetHref({
                payrollMonth: detail.payrollMonth,
                employeeId: detail.employee.id,
              })}
              className="text-primary text-sm hover:underline"
            >
              Pay Now (this employee)
            </Link>
          </>
        )}
      </div>
      {expense.payments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expense.payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatPaymentDate(payment.paymentDate)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(parseAmount(payment.amount))}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[12rem] truncate">
                  {payment.notes ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export function EmployeeMonthCompensationSheet({
  salaryLineId,
  open,
  onOpenChange,
  initialDetail = null,
  readOnly = false,
  detailScope = 'finance',
}: {
  salaryLineId: string | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** List-row seed for instant header while month detail hydrates. */
  initialDetail?: SalaryLineMonthDetail | null;
  /** Wallet: hide Finance navigation links. */
  readOnly?: boolean;
  detailScope?: SalaryLineMonthDetailScope;
}) {
  const { detail, loading, loadError } = useSalaryLineMonthDetail(
    salaryLineId,
    open,
    detailScope,
    initialDetail,
  );

  const emptyHint = readOnly
    ? 'Select a month on your wallet.'
    : 'Select a month cell on the salary board.';

  const showKpiTab = detail?.hasKpiPolicy === true;
  const [activeTab, setActiveTab] = useState('general');
  const resolvedActiveTab = !showKpiTab && activeTab === 'kpi' ? 'general' : activeTab;

  const compensationTabs = useMemo(() => {
    const tabs = [
      { value: 'general', label: 'General' },
      { value: 'bonuses', label: 'Bonuses' },
    ];
    if (showKpiTab) tabs.push({ value: 'kpi', label: 'KPI' });
    return tabs;
  }, [showKpiTab]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setActiveTab('general');
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <EntityDetailSheetContent
        open={open}
        layout="auxiliary"
        className="gap-0"
        contentClassName="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[50vw]"
        railAnchorClassName="sm:right-[50vw]"
      >
        <SheetHeader>
          <SheetTitle>
            {readOnly ? 'Your month compensation' : 'Employee month compensation'}
          </SheetTitle>
          <SheetDescription>{detail ? employeeName(detail) : emptyHint}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {loading && !detail ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading compensation…
            </div>
          ) : null}
          {loadError ? <p className="text-destructive text-sm">{loadError}</p> : null}

          {detail && !loadError ? (
            <>
              {readOnly ? <WalletMonthSheetHints detail={detail} /> : null}
              <div className="flex min-h-0 flex-1 flex-col">
                <DetailSheetTabBar
                  tabs={compensationTabs}
                  activeTab={resolvedActiveTab}
                  onTabChange={setActiveTab}
                />
                <DetailSheetTabPanel
                  tabKey={resolvedActiveTab}
                  className="min-h-0 flex-1 overflow-y-auto"
                >
                  {resolvedActiveTab === 'general' ? (
                    <div className="flex flex-col gap-4 pt-2">
                      <EmployeeMonthCompensationSummary detail={detail} readOnly={readOnly} />
                      <EmployeeMonthCompensationKpiSummaryLine detail={detail} />
                      <DetailSheetSection
                        title={readOnly ? 'Payments' : 'Pay Now / payments'}
                        icon={<Banknote className="size-4" aria-hidden />}
                      >
                        <ExpensePaymentsSection detail={detail} readOnly={readOnly} />
                      </DetailSheetSection>
                    </div>
                  ) : null}
                  {resolvedActiveTab === 'bonuses' ? (
                    <div className="pt-2">
                      <DetailSheetSection
                        title="Bonus breakdown"
                        icon={<Banknote className="size-4" aria-hidden />}
                      >
                        <SalaryMonthBonusBreakdown detail={detail} />
                      </DetailSheetSection>
                    </div>
                  ) : null}
                  {resolvedActiveTab === 'kpi' && showKpiTab ? (
                    <div className="pt-2">
                      <EmployeeMonthCompensationKpiSection detail={detail} />
                    </div>
                  ) : null}
                </DetailSheetTabPanel>
              </div>
            </>
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
