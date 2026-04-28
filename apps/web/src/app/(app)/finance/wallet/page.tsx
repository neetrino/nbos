'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
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
      />

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
                        <div className="text-foreground font-medium">
                          {b.project.code} · {b.order.code}
                        </div>
                        <div className="text-muted-foreground mt-0.5">{b.type}</div>
                        <div className="text-foreground mt-1 font-semibold">
                          {formatAmount(parseAmount(b.amount))}
                        </div>
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
    </div>
  );
}
