'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatAmount } from '@/features/finance/constants/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { cn } from '@/lib/utils';
import {
  payrollRunsApi,
  type PayrollRunDetail,
  type PayrollRunKpiResults,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';

const EDITABLE_STATUSES: PayrollRunStatus[] = ['DRAFT', 'REVIEW'];

function parseAmount(value: string | null): number | null {
  if (value == null) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function formatPayoutFactor(value: string): string {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return value;
  return `${(n * 100).toFixed(0)}%`;
}

function formatAttainment(value: string | null): string {
  if (value == null) return '—';
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1)}%`;
}

export function PayrollRunKpiResultsSection({ run }: { run: PayrollRunDetail }) {
  const [data, setData] = useState<PayrollRunKpiResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSync = EDITABLE_STATUSES.includes(run.status);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollRunsApi.getKpiResults(run.id);
      setData(result);
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Could not load KPI results.'));
    } finally {
      setLoading(false);
    }
  }, [run.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await payrollRunsApi.syncSalesKpiResults(run.id);
      setData(result);
      toast.success(
        result.items.length === 0
          ? 'No employees with an active KPI policy on this run.'
          : `Synced ${result.items.length} KPI result${result.items.length === 1 ? '' : 's'}.`,
      );
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not sync KPI results.'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">KPI payout results</h2>
          <p className="text-muted-foreground mt-1 max-w-3xl text-xs leading-snug">
            Targets and gate bands live in My Company. Sync resolves monthly plan (from policy) and
            actual (from Sales payments) into snapshots used when attaching Sales bonuses.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/my-company/kpi-policies"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            KPI policies
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || syncing}
            onClick={() => void load()}
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
          {canSync ? (
            <Button
              type="button"
              size="sm"
              disabled={loading || syncing}
              onClick={() => void handleSync()}
            >
              {syncing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Syncing…
                </>
              ) : (
                'Sync Sales KPI'
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading KPI results…
        </div>
      ) : null}
      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}

      {!loading && data ? (
        <div className="mt-4">
          {data.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {canSync
                ? 'No snapshots yet. Sync Sales KPI before attaching Sales bonus releases for employees with a KPI policy.'
                : 'No KPI snapshots were stored for this run.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Plan</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Attainment</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((row) => {
                    const plan = parseAmount(row.planAmount);
                    const actual = parseAmount(row.actualAmount);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.employeeName}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {plan != null ? formatAmount(plan) : '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {actual != null ? formatAmount(actual) : '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAttainment(row.attainmentPct)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPayoutFactor(row.payoutFactor)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!canSync && data.items.length > 0 ? (
            <p className="text-muted-foreground mt-3 text-xs">
              Snapshots are read-only after the run leaves Draft/Review.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
