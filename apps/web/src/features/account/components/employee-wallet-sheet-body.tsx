'use client';

import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { WalletBonusForecastCard } from '@/features/account/components/wallet-bonus-forecast-card';
import { WalletBonusPipelineSection } from '@/features/account/components/wallet-bonus-pipeline-section';
import { WalletCompensationGlossary } from '@/features/account/components/wallet-compensation-glossary';
import { WalletPayrollSalaryLinesSection } from '@/features/account/components/wallet-payroll-salary-lines-section';
import { WalletProjectBreakdownSection } from '@/features/account/components/wallet-project-breakdown-section';
import { WalletRecentActivitySection } from '@/features/account/components/wallet-recent-activity-section';
import { WalletSalaryMonthCards } from '@/features/account/components/wallet-salary-month-cards';
import { formatAmount } from '@/features/finance/constants/finance';
import type { EmployeeWalletSnapshot } from '@/lib/api/me';

function parseAmount(value: string | null): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

interface EmployeeWalletSheetBodyProps {
  data: EmployeeWalletSnapshot;
  openSalaryLineId: string | null;
  onOpenMonth: (salaryLineId: string) => void;
  bonusSubmitting: boolean;
  salarySubmitting: boolean;
  projectBreakdownSubmitting: boolean;
  onExportBonusesCsv: () => void;
  onExportSalaryCsv: () => void;
  onExportProjectBreakdownCsv: () => void;
}

export function EmployeeWalletSheetBody({
  data,
  openSalaryLineId,
  onOpenMonth,
  bonusSubmitting,
  salarySubmitting,
  projectBreakdownSubmitting,
  onExportBonusesCsv,
  onExportSalaryCsv,
  onExportProjectBreakdownCsv,
}: EmployeeWalletSheetBodyProps) {
  const { employee } = data;
  const displayName = `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
      <PageHeader
        title="My wallet"
        description="Read-only NBOS view: base pay, bonus pipeline, and payroll salary lines tied to expenses."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bonusSubmitting || data.bonuses.length === 0}
            onClick={onExportBonusesCsv}
            aria-label="Export wallet bonus pipeline as UTF-8 CSV"
          >
            {bonusSubmitting ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" aria-hidden />
            ) : (
              <Download size={14} className="mr-1.5" aria-hidden />
            )}
            Bonuses CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={salarySubmitting || data.salaryHistory.length === 0}
            onClick={onExportSalaryCsv}
            aria-label="Export wallet payroll salary lines as UTF-8 CSV"
          >
            {salarySubmitting ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" aria-hidden />
            ) : (
              <Download size={14} className="mr-1.5" aria-hidden />
            )}
            Payroll CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={projectBreakdownSubmitting || data.projectBreakdown.length === 0}
            onClick={onExportProjectBreakdownCsv}
            aria-label="Export wallet project breakdown as UTF-8 CSV"
          >
            {projectBreakdownSubmitting ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" aria-hidden />
            ) : (
              <Download size={14} className="mr-1.5" aria-hidden />
            )}
            Projects CSV
          </Button>
        </div>
      </PageHeader>

      <WalletCompensationGlossary />
      <WalletBonusForecastCard data={data} />

      <section className="border-border bg-card rounded-2xl border p-5">
        <h2 className="text-foreground text-sm font-semibold">Current compensation</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          {displayName} · {employee.roleName}
          {employee.position ? ` · ${employee.position}` : ''}
          {employee.level ? ` · ${employee.level}` : ''}
        </p>
        <p className="text-foreground mt-3 text-2xl font-semibold">
          {employee.baseSalary != null && employee.baseSalary !== ''
            ? formatAmount(parseAmount(employee.baseSalary))
            : '—'}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Base salary from HR record (not a bank balance).
        </p>
      </section>

      <section className="border-border bg-card rounded-2xl border p-5">
        <h2 className="text-foreground text-sm font-semibold">Next payroll</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Earliest open payroll run (Draft → Paying) that includes your salary line. Not a bank
          balance.
        </p>
        {data.nextPayroll ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-foreground text-lg font-semibold tabular-nums">
                  {data.nextPayroll.payrollMonth}
                </p>
                <p className="text-muted-foreground text-xs">
                  Run status: {data.nextPayroll.runStatus}
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-primary h-auto px-0 text-xs"
                onClick={() => onOpenMonth(data.nextPayroll!.salaryLineId)}
              >
                View month details
              </Button>
            </div>
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Base</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatAmount(parseAmount(data.nextPayroll.baseSalary))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Bonuses (line)</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatAmount(parseAmount(data.nextPayroll.bonusesTotal))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total payable</dt>
                <dd className="text-foreground font-semibold tabular-nums">
                  {formatAmount(parseAmount(data.nextPayroll.totalPayable))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paid / Remaining</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatAmount(parseAmount(data.nextPayroll.paidAmount))} /{' '}
                  {formatAmount(parseAmount(data.nextPayroll.remainingAmount))}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Salary line status</dt>
                <dd className="text-foreground font-medium">{data.nextPayroll.lineStatus}</dd>
              </div>
            </dl>
            {data.nextPayroll.expenseId ? (
              <p className="text-muted-foreground text-xs">
                Payroll expense card is linked — see payment timeline in month details.
              </p>
            ) : null}
            {parseAmount(data.nextPayroll.paidAmount) > 0 &&
            parseAmount(data.nextPayroll.remainingAmount) > 0 ? (
              <p className="text-muted-foreground text-[11px] leading-snug">
                Partial pay — part of this month was paid via the payroll expense card; the rest
                stays on your salary line until Finance records further payments.
              </p>
            ) : null}
            {data.nextPayroll.partialPayments.length > 0 ? (
              <div>
                <h3 className="text-foreground mb-2 text-xs font-semibold">
                  Outgoing payments (expense)
                </h3>
                <ul className="text-muted-foreground space-y-1 text-[11px]">
                  {data.nextPayroll.partialPayments.map((p, idx) => (
                    <li key={`${p.paymentDate}-${idx}`} className="tabular-nums">
                      {p.paymentDate.slice(0, 10)} · {formatAmount(parseAmount(p.amount))}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground mt-3 text-xs">
            No open payroll run includes your line yet (or all your runs are closed).
          </p>
        )}
      </section>

      <section className="border-border bg-card rounded-2xl border p-5">
        <h2 className="text-foreground text-sm font-semibold">Salary by month</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          Three payout states (accumulating, active payout, paid). Tap a month for bonus list and
          payment progress.
        </p>
        <div className="mt-4">
          <WalletSalaryMonthCards
            rows={data.salaryHistory}
            onOpenMonth={onOpenMonth}
            highlightSalaryLineId={openSalaryLineId}
          />
        </div>
      </section>

      <WalletRecentActivitySection activity={data.activity} />
      <WalletBonusPipelineSection bonuses={data.bonuses} />
      <WalletPayrollSalaryLinesSection rows={data.salaryHistory} onOpenMonth={onOpenMonth} />
      <WalletProjectBreakdownSection rows={data.projectBreakdown} />
    </div>
  );
}
