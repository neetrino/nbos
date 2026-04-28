'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { payrollRunDetailPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import {
  PAYROLL_JOURNAL_KIND_LABEL,
  PAYROLL_RUN_STATUS_LABEL,
  payrollRunActionOptions,
} from '@/features/finance/constants/payroll-run-ui';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunDetail,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function employeeName(emp: { firstName: string; lastName: string }): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

function formatJournalAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PayrollRunDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [run, setRun] = useState<PayrollRunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  useFinanceDocumentTitle(payrollRunDetailPageTitle(run?.payrollMonth));

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await payrollRunsApi.getById(id);
      setRun(data);
    } catch (caught) {
      setRun(null);
      setError(getApiErrorMessage(caught, 'Payroll run could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyStatus = useCallback(
    async (next: PayrollRunStatus) => {
      if (!id) return;
      setStatusBusy(true);
      setActionError(null);
      try {
        const updated = await payrollRunsApi.updateStatus(id, next);
        setRun(updated);
      } catch (caught) {
        setActionError(getApiErrorMessage(caught, 'Status could not be updated.'));
      } finally {
        setStatusBusy(false);
      }
    },
    [id],
  );

  if (!id) {
    return <ErrorState description="Invalid payroll run." />;
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingState />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/finance/payroll"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={14} />
          Back to payroll
        </Link>
        <ErrorState description={error ?? 'Not found'} onRetry={() => void load()} />
      </div>
    );
  }

  const actions = payrollRunActionOptions(run.status);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/finance/payroll"
            className="text-muted-foreground hover:text-foreground mb-2 -ml-2 inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <h1 className="text-foreground text-2xl font-semibold">Payroll · {run.payrollMonth}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Status: {PAYROLL_RUN_STATUS_LABEL[run.status]}
            {run.salaryLines.length > 0
              ? ` · ${run.salaryLines.length} salary line(s)`
              : ' · no salary lines'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCcw size={16} />
          </Button>
          {actions.map((a) => (
            <Button
              key={a.to}
              type="button"
              variant={a.to === 'DRAFT' ? 'outline' : 'default'}
              disabled={statusBusy}
              onClick={() => void applyStatus(a.to)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {actionError ? <p className="text-destructive text-sm">{actionError}</p> : null}

      {run.status === 'APPROVED' || run.status === 'PAYING' || run.status === 'CLOSED' ? (
        <p className="text-muted-foreground text-sm">
          Approved runs materialize one expense card per payable salary line (linked below). Pay via
          Finance → Expenses and partial payments as usual.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Summary label="Total base" value={formatAmount(parseAmount(run.totalBaseSalary))} />
        <Summary label="Bonuses" value={formatAmount(parseAmount(run.totalBonuses))} />
        <Summary label="Payable" value={formatAmount(parseAmount(run.totalPayable))} accent />
        <Summary label="Paid" value={formatAmount(parseAmount(run.totalPaid))} />
      </div>

      <section className="border-border bg-card rounded-xl border p-4">
        <h2 className="text-foreground text-sm font-semibold">Run journal</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Milestones from stored timestamps only. Intermediate workflow steps (e.g. review or
          paying) are not listed until NBOS audit logging covers payroll runs.
        </p>
        <ul className="mt-3 space-y-0">
          {run.journal.map((entry) => (
            <li
              key={`${entry.kind}-${entry.at}`}
              className="border-border flex flex-wrap items-start justify-between gap-2 border-t py-3 first:border-t-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="text-foreground text-sm font-medium">
                  {PAYROLL_JOURNAL_KIND_LABEL[entry.kind]}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">{entry.summary}</p>
                {entry.actorName ? (
                  <p className="text-muted-foreground mt-1 text-xs">By {entry.actorName}</p>
                ) : null}
              </div>
              <time
                className="text-muted-foreground shrink-0 text-xs tabular-nums"
                dateTime={entry.at}
              >
                {formatJournalAt(entry.at)}
              </time>
            </li>
          ))}
        </ul>
      </section>

      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Base</TableHead>
              <TableHead className="text-right">Bonuses</TableHead>
              <TableHead className="text-right">Payable</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Expense</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {run.salaryLines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                  No salary lines. Create the run with “seed lines” or add lines in a future
                  release.
                </TableCell>
              </TableRow>
            ) : (
              run.salaryLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{employeeName(line.employee)}</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(line.baseSalary))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(line.bonusesTotal))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(line.totalPayable))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(line.remainingAmount))}
                  </TableCell>
                  <TableCell>
                    {line.expense ? (
                      <Link
                        href={`/finance/expenses/${line.expense.id}`}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        {line.expense.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${accent ? 'text-accent' : ''}`}>{value}</p>
    </div>
  );
}
