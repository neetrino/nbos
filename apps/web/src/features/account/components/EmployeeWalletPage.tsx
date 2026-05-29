'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, User, Wallet } from 'lucide-react';
import { EmployeeMonthCompensationSheet } from '@/features/finance/components/payroll/employee-month-compensation-sheet';
import { WalletBonusForecastCard } from '@/features/account/components/wallet-bonus-forecast-card';
import { WalletBonusPipelineSection } from '@/features/account/components/wallet-bonus-pipeline-section';
import { WalletCompensationGlossary } from '@/features/account/components/wallet-compensation-glossary';
import { WalletProjectBreakdownSection } from '@/features/account/components/wallet-project-breakdown-section';
import { WalletSalaryMonthCards } from '@/features/account/components/wallet-salary-month-cards';
import { WALLET_OPEN_SALARY_LINE_QUERY } from '@/features/account/constants/wallet-url';
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
import { useEmployeeWalletCsvExport } from '@/features/finance/components/wallet/use-employee-wallet-csv-export';
import { usePageDocumentTitle } from '@/features/account/hooks/use-page-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { meApi, type EmployeeWalletSnapshot } from '@/lib/api/me';

function parseAmount(value: string | null): number {
  if (value == null || value === '') return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function salaryLineInWallet(data: EmployeeWalletSnapshot, salaryLineId: string): boolean {
  if (data.nextPayroll?.salaryLineId === salaryLineId) {
    return true;
  }
  return data.salaryHistory.some((row) => row.id === salaryLineId);
}

export function EmployeeWalletPage() {
  usePageDocumentTitle('My wallet');

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const replaceWalletUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const openSalaryLineId = searchParams.get(WALLET_OPEN_SALARY_LINE_QUERY)?.trim() || null;
  const monthSheetOpen = Boolean(openSalaryLineId);

  const openMonthSheet = useCallback(
    (salaryLineId: string) => {
      replaceWalletUrl((params) => {
        params.set(WALLET_OPEN_SALARY_LINE_QUERY, salaryLineId);
      });
    },
    [replaceWalletUrl],
  );

  const handleMonthSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      replaceWalletUrl((params) => {
        params.delete(WALLET_OPEN_SALARY_LINE_QUERY);
      });
    },
    [replaceWalletUrl],
  );

  useEffect(() => {
    if (loading || !openSalaryLineId || !data) return;
    if (!salaryLineInWallet(data, openSalaryLineId)) {
      replaceWalletUrl((params) => {
        params.delete(WALLET_OPEN_SALARY_LINE_QUERY);
      });
    }
  }, [data, loading, openSalaryLineId, replaceWalletUrl]);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold">My Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Profile, wallet, security, and notification preferences.
        </p>
      </div>

      <div className="border-border flex items-center gap-1 border-b pb-0">
        <Link
          href="/my-account"
          className="text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <User size={16} aria-hidden />
          Profile
        </Link>
        <span className="bg-primary text-primary-foreground flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium">
          <Wallet size={16} aria-hidden />
          Wallet
        </span>
      </div>

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
                  onClick={() => openMonthSheet(data.nextPayroll!.salaryLineId)}
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
              onOpenMonth={openMonthSheet}
              highlightSalaryLineId={openSalaryLineId}
            />
          </div>
        </section>

        <section className="border-border bg-card rounded-2xl border p-5">
          <h2 className="text-foreground text-sm font-semibold">Recent activity</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-snug">
            Latest payroll and bonus events tied to you (read-only).
          </p>
          {data.activity.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-xs">No recent events yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.activity.map((item) => (
                <li
                  key={item.id}
                  className="border-border flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-foreground text-xs font-medium">{item.title}</span>
                    <time
                      className="text-muted-foreground text-[11px] tabular-nums"
                      dateTime={item.occurredAt}
                    >
                      {item.occurredAt.slice(0, 10)}
                    </time>
                  </div>
                  {item.detail ? (
                    <p className="text-muted-foreground text-[11px] leading-snug">{item.detail}</p>
                  ) : null}
                  {item.linkHref ? (
                    <Link
                      href={item.linkHref}
                      className="text-primary w-fit text-[11px] font-medium hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <WalletBonusPipelineSection bonuses={data.bonuses} />

        <section>
          <h2 className="text-foreground mb-3 text-sm font-semibold">Payroll salary lines</h2>
          <div className="border-border overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.salaryHistory.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      No payroll lines yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.salaryHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openMonthSheet(row.id)}
                          className="text-foreground hover:text-primary font-medium hover:underline"
                        >
                          {row.payrollMonth}
                        </button>
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
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-primary h-auto px-0 text-xs"
                          onClick={() => openMonthSheet(row.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <WalletProjectBreakdownSection rows={data.projectBreakdown} />
      </div>

      <EmployeeMonthCompensationSheet
        salaryLineId={openSalaryLineId}
        open={monthSheetOpen}
        onOpenChange={handleMonthSheetOpenChange}
        readOnly
        detailScope="wallet"
      />
    </div>
  );
}
