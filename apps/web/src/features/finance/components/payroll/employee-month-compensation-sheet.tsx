'use client';

import Link from 'next/link';
import { Banknote, Loader2, Wallet } from 'lucide-react';
import { DetailSheetSection, EntityDetailSheetContent, StatusBadge } from '@/components/shared';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { COMPENSATION_PAYOUT_PHASE_UI } from '@/features/finance/constants/compensation-payout-phase-ui';
import { formatAmount } from '@/features/finance/constants/finance';
import { expenseLedgerPaymentStatusPresentation } from '@/features/finance/constants/expense-ledger-payment-status';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { expensesPayrollPresetHref } from '@/features/finance/constants/expense-payroll-filter';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import { EmployeeMonthCompensationKpiSection } from '@/features/finance/components/payroll/employee-month-compensation-kpi-section';
import { EmployeeMonthCompensationKpiSummaryLine } from '@/features/finance/components/payroll/employee-month-compensation-kpi-summary-line';
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

function SummaryGrid({ detail, readOnly }: { detail: SalaryLineMonthDetail; readOnly: boolean }) {
  const lineUi = salaryLineStatusBoardUi(detail.salaryLine.status);
  const phaseUi = COMPENSATION_PAYOUT_PHASE_UI[detail.payoutPhase];
  const base = parseAmount(detail.salaryLine.baseSalary);
  const bonuses = parseAmount(detail.salaryLine.bonusesTotal);
  const total = parseAmount(detail.salaryLine.totalPayable);
  const paid = parseAmount(detail.salaryLine.paidAmount);
  const remaining = parseAmount(detail.salaryLine.remainingAmount);
  const carry = detail.pendingPayrollCarryOver ? parseAmount(detail.pendingPayrollCarryOver) : null;

  return (
    <DetailSheetSection title="Month summary" icon={<Wallet className="size-4" aria-hidden />}>
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <StatusBadge label={phaseUi.label} variant={phaseUi.variant} />
        <StatusBadge label={lineUi.label} variant={lineUi.variant} />
        <span className="text-muted-foreground text-xs">{phaseUi.description}</span>
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Base salary</dt>
          <dd className="font-medium tabular-nums">{formatAmount(base)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Bonuses</dt>
          <dd className="font-medium tabular-nums">{formatAmount(bonuses)}</dd>
        </div>
        {carry != null && carry > 0 ? (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Pending carry-over</dt>
            <dd className="font-medium tabular-nums">{formatAmount(carry)}</dd>
          </div>
        ) : null}
        <div className="border-border flex items-baseline justify-between gap-4 border-t pt-2">
          <dt className="text-foreground font-semibold">Total payable</dt>
          <dd className="text-foreground text-base font-semibold tabular-nums">
            {formatAmount(total)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Paid</dt>
          <dd className="font-medium tabular-nums">{formatAmount(paid)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Remaining</dt>
          <dd className="font-medium tabular-nums">{formatAmount(remaining)}</dd>
        </div>
      </dl>
      <p className="text-muted-foreground pt-3 text-xs">
        {readOnly ? (
          <>
            Payroll month <span className="text-foreground font-medium">{detail.payrollMonth}</span>
          </>
        ) : (
          <>
            Payroll run{' '}
            <Link
              href={`/finance/payroll/${detail.payrollRun.id}`}
              className="text-primary hover:underline"
            >
              {detail.payrollMonth}
            </Link>{' '}
            · {PAYROLL_RUN_STATUS_LABEL[detail.payrollRun.status]}
          </>
        )}
      </p>
    </DetailSheetSection>
  );
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
  readOnly = false,
  detailScope = 'finance',
}: {
  salaryLineId: string | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Wallet: hide Finance navigation links. */
  readOnly?: boolean;
  detailScope?: SalaryLineMonthDetailScope;
}) {
  const { detail, loading, loadError } = useSalaryLineMonthDetail(salaryLineId, open, detailScope);

  const emptyHint = readOnly
    ? 'Select a month on your wallet.'
    : 'Select a month cell on the salary board.';

  const showKpiTab = detail?.hasKpiPolicy === true;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <EntityDetailSheetContent open={open} layout="full" width="wide" className="gap-0">
        <SheetHeader>
          <SheetTitle>
            {readOnly ? 'Your month compensation' : 'Employee month compensation'}
          </SheetTitle>
          <SheetDescription>
            {detail ? `${employeeName(detail)} · ${detail.payrollMonth}` : emptyHint}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {loading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading compensation…
            </div>
          ) : null}
          {loadError ? <p className="text-destructive text-sm">{loadError}</p> : null}

          {!loading && !loadError && detail ? (
            <>
              {readOnly ? <WalletMonthSheetHints detail={detail} /> : null}
              <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
                <TabsList variant="line" className="shrink-0">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
                  {showKpiTab ? <TabsTrigger value="kpi">KPI</TabsTrigger> : null}
                </TabsList>
                <TabsContent value="general" className="min-h-0 flex-1 overflow-y-auto">
                  <div className="flex flex-col gap-4 pt-2">
                    <SummaryGrid detail={detail} readOnly={readOnly} />
                    <EmployeeMonthCompensationKpiSummaryLine detail={detail} />
                    <DetailSheetSection
                      title={readOnly ? 'Payments' : 'Pay Now / payments'}
                      icon={<Banknote className="size-4" aria-hidden />}
                    >
                      <ExpensePaymentsSection detail={detail} readOnly={readOnly} />
                    </DetailSheetSection>
                  </div>
                </TabsContent>
                <TabsContent value="bonuses" className="min-h-0 flex-1 overflow-y-auto">
                  <div className="pt-2">
                    <DetailSheetSection
                      title="Bonus breakdown"
                      icon={<Banknote className="size-4" aria-hidden />}
                    >
                      <SalaryMonthBonusBreakdown detail={detail} />
                    </DetailSheetSection>
                  </div>
                </TabsContent>
                {showKpiTab ? (
                  <TabsContent value="kpi" className="min-h-0 flex-1 overflow-y-auto">
                    <div className="pt-2">
                      <EmployeeMonthCompensationKpiSection detail={detail} />
                    </div>
                  </TabsContent>
                ) : null}
              </Tabs>
            </>
          ) : null}
        </div>
      </EntityDetailSheetContent>
    </Sheet>
  );
}
