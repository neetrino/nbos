'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  WALLET_BONUS_PIPELINE_LABEL,
  WALLET_BONUS_PIPELINE_ORDER,
} from '@/features/finance/constants/employee-wallet-ui';
import { employeeWalletPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useEmployeeWalletCsvExport } from '@/features/finance/components/wallet/use-employee-wallet-csv-export';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  meApi,
  type EmployeeWalletBonusRow,
  type EmployeeWalletSnapshot,
  type WalletBonusPipelineGroup,
} from '@/lib/api/me';

function parseAmount(value: string | null): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function groupBonuses(
  rows: EmployeeWalletBonusRow[],
): Map<WalletBonusPipelineGroup, EmployeeWalletBonusRow[]> {
  const map = new Map<WalletBonusPipelineGroup, EmployeeWalletBonusRow[]>();
  for (const g of WALLET_BONUS_PIPELINE_ORDER) {
    map.set(g, []);
  }
  for (const row of rows) {
    map.get(row.walletGroup)?.push(row);
  }
  return map;
}

export default function EmployeeWalletPage() {
  useFinanceDocumentTitle(employeeWalletPageTitle());

  const [data, setData] = useState<EmployeeWalletSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await meApi.getWallet();
      setData(snap);
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Wallet could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bonusGroups = useMemo(() => (data ? groupBonuses(data.bonuses) : null), [data]);

  const {
    bonusSubmitting,
    salarySubmitting,
    projectBreakdownSubmitting,
    exportBonusesCsv,
    exportSalaryCsv,
    exportProjectBreakdownCsv,
  } = useEmployeeWalletCsvExport(data);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="My wallet"
          description="Read-only view of your compensation and bonuses."
        />
        <LoadingState />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="My wallet"
          description="Read-only view of your compensation and bonuses."
        />
        <ErrorState description={error ?? 'Unavailable'} onRetry={() => void load()} />
      </div>
    );
  }

  const { employee } = data;
  const displayName = `${employee.firstName} ${employee.lastName}`.trim();

  return (
    <div className="flex flex-col gap-6">
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
            onClick={() => exportBonusesCsv()}
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
            onClick={() => exportSalaryCsv()}
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
            onClick={() => exportProjectBreakdownCsv()}
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
              <Link
                href={`/finance/payroll/${data.nextPayroll.payrollRunId}`}
                className="text-primary text-xs font-medium hover:underline"
              >
                Open payroll run
              </Link>
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
                <dt className="text-muted-foreground">Adjustments</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatAmount(parseAmount(data.nextPayroll.adjustmentsTotal))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Deductions</dt>
                <dd className="text-foreground font-medium tabular-nums">
                  {formatAmount(parseAmount(data.nextPayroll.deductionsTotal))}
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
                Expense card:{' '}
                <Link
                  href={`/finance/expenses/${data.nextPayroll.expenseId}`}
                  className="text-primary font-medium hover:underline"
                >
                  Open
                </Link>
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

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Bonus pipeline</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WALLET_BONUS_PIPELINE_ORDER.map((group) => {
            const rows = bonusGroups?.get(group) ?? [];
            return (
              <div key={group} className="border-border bg-card rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-muted-foreground" />
                  <h3 className="text-foreground text-xs font-semibold">
                    {WALLET_BONUS_PIPELINE_LABEL[group]}
                  </h3>
                  <span className="bg-secondary text-muted-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
                    {rows.length}
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {rows.length === 0 ? (
                    <li className="text-muted-foreground text-xs">No entries</li>
                  ) : (
                    rows.map((b) => (
                      <li key={b.id} className="border-border rounded-lg border p-2.5 text-xs">
                        <div className="text-foreground leading-snug font-semibold">
                          {b.productLabel}
                        </div>
                        <div className="text-muted-foreground mt-1 text-[11px]">
                          {b.project.code} · {b.order.code}
                        </div>
                        <div className="text-muted-foreground mt-0.5">{b.type}</div>
                        <div className="text-foreground mt-1 font-semibold">
                          Planned {formatAmount(parseAmount(b.amount))}
                        </div>
                        <div className="text-muted-foreground mt-1 leading-snug tabular-nums">
                          Released {formatAmount(parseAmount(b.releasedAmount))} · Paid{' '}
                          {formatAmount(parseAmount(b.paidAmount))} · Remaining{' '}
                          {formatAmount(parseAmount(b.remainingAmount))}
                        </div>
                        {b.payrollMonth ? (
                          <div className="text-muted-foreground mt-1 text-[10px]">
                            Payroll (release): {b.payrollMonth}
                          </div>
                        ) : null}
                        {b.salesAccrualHint ? (
                          <div className="text-muted-foreground mt-1 text-[10px]">
                            {b.salesAccrualHint}
                          </div>
                        ) : null}
                        {b.orderPaymentType === 'SUBSCRIPTION' ? (
                          <div className="text-muted-foreground mt-1 text-[10px] leading-snug">
                            Subscription order — bonus releases may follow client invoice payments.
                          </div>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Payroll salary lines</h2>
        <div className="border-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Payroll run</TableHead>
                <TableHead className="text-right">Payable</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Line</TableHead>
                <TableHead>Expense</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.salaryHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center text-sm">
                    No payroll lines yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.salaryHistory.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.payrollMonth}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/finance/payroll/${row.payrollRunId}`}
                          className="text-primary text-xs font-medium hover:underline"
                        >
                          Open run
                        </Link>
                        <span className="text-muted-foreground text-xs">{row.runStatus}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(parseAmount(row.totalPayable))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(parseAmount(row.paidAmount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(parseAmount(row.remainingAmount))}
                    </TableCell>
                    <TableCell className="text-xs">{row.lineStatus}</TableCell>
                    <TableCell>
                      {row.expenseId ? (
                        <Link
                          href={`/finance/expenses/${row.expenseId}`}
                          className="text-primary text-xs font-medium hover:underline"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="text-foreground mb-3 text-sm font-semibold">Project breakdown</h2>
        <p className="text-muted-foreground mb-3 text-xs leading-snug">
          Per-order roll-up of your bonus entries with product pool funding context (read-only).
        </p>
        <div className="border-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Product scope</TableHead>
                <TableHead>Bonus types</TableHead>
                <TableHead className="text-right">Planned</TableHead>
                <TableHead className="text-right">Released</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Funding</TableHead>
                <TableHead className="text-right">Pool available</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Entry status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.projectBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    No bonus orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.projectBreakdown.map((row) => (
                  <TableRow key={row.orderId}>
                    <TableCell>
                      <Link
                        href={`/projects/${row.projectId}`}
                        className="text-primary text-xs font-medium hover:underline"
                      >
                        {row.project.code}
                      </Link>
                      <div className="text-muted-foreground mt-0.5 max-w-[10rem] truncate text-[11px]">
                        {row.project.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{row.order.code}</TableCell>
                    <TableCell className="max-w-[12rem] text-xs">{row.productLabel}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[8rem] text-[11px]">
                      {row.bonusTypesSummary}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatAmount(parseAmount(row.plannedBonus))}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatAmount(parseAmount(row.releasedBonus))}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatAmount(parseAmount(row.paidBonus))}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {formatAmount(parseAmount(row.remainingBonus))}
                    </TableCell>
                    <TableCell className="max-w-[14rem] text-[11px] leading-snug">
                      {row.fundingStatusLabels.join(' · ')}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {row.poolAvailableFunding != null
                        ? formatAmount(parseAmount(row.poolAvailableFunding))
                        : '—'}
                    </TableCell>
                    <TableCell className="text-xs">{row.payoutState}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[10rem] text-[11px]">
                      {row.entryStatusesSummary}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
