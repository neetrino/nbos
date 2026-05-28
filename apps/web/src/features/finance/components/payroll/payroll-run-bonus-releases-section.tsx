'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  payrollRunsApi,
  type PayrollRunBonusReleaseRow,
  type PayrollRunBonusReleases,
  type PayrollRunDetail,
} from '@/lib/api/payroll-runs';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function ReleaseTable({
  rows,
  emptyLabel,
}: {
  rows: PayrollRunBonusReleaseRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Release</TableHead>
            <TableHead className="text-right">Included</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.employeeName}</TableCell>
              <TableCell>{row.projectCode}</TableCell>
              <TableCell className="max-w-[10rem] truncate" title={row.productLabel}>
                {row.productLabel}
              </TableCell>
              <TableCell className="text-xs">
                {row.bonusType} · {row.releaseType}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(parseAmount(row.amount))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.payrollIncludedAmount
                  ? formatAmount(parseAmount(row.payrollIncludedAmount))
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PayrollRunBonusReleasesSection({
  run,
  onRunUpdated,
}: {
  run: PayrollRunDetail;
  onRunUpdated: (run: PayrollRunDetail) => void;
}) {
  const [data, setData] = useState<PayrollRunBonusReleases | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollRunsApi.getBonusReleases(run.id);
      setData(result);
      setSelected(new Set());
    } catch (caught) {
      setData(null);
      setError(getApiErrorMessage(caught, 'Could not load bonus releases.'));
    } finally {
      setLoading(false);
    }
  }, [run.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleAttach = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await payrollRunsApi.attachBonusReleases(run.id, ids);
      onRunUpdated(updated);
      await load();
      toast.success(`Attached ${ids.length} release${ids.length === 1 ? '' : 's'}`);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not attach releases.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetach = async (releaseIds: string[]) => {
    if (releaseIds.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await payrollRunsApi.detachBonusReleases(run.id, releaseIds);
      onRunUpdated(updated);
      await load();
      toast.success(`Detached ${releaseIds.length} release${releaseIds.length === 1 ? '' : 's'}`);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not detach releases.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-border bg-card rounded-xl border p-4">
      <h2 className="text-foreground text-sm font-semibold">Bonus releases</h2>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Attach approved releases while the run is Draft or Review. Payroll uses the payable amount
        already resolved by bonus/KPI policies; it does not collect KPI targets here.
      </p>

      {loading ? (
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading releases…
        </div>
      ) : null}
      {error ? <p className="text-destructive mt-3 text-sm">{error}</p> : null}

      {!loading && data ? (
        <div className="mt-4 flex flex-col gap-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-foreground text-xs font-semibold">
                Included in payroll ({data.included.length})
              </h3>
              {data.included.length > 0 && data.canAttach ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => void handleDetach(data.included.map((r) => r.id))}
                >
                  Detach all
                </Button>
              ) : null}
            </div>
            <ReleaseTable rows={data.included} emptyLabel="No releases attached yet." />
          </div>

          {data.canAttach ? (
            <div>
              <h3 className="text-foreground mb-2 text-xs font-semibold">
                Available to attach ({data.availableToAttach.length})
              </h3>
              {data.availableToAttach.length === 0 ? (
                <p className="text-muted-foreground text-sm">No APPROVED releases ready.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.availableToAttach.map((row) => (
                    <li
                      key={row.id}
                      className="border-border flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(v) => toggleSelect(row.id, v === true)}
                        aria-label={`Select release for ${row.employeeName}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{row.employeeName}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {row.projectCode} · {row.productLabel} ·{' '}
                          {formatAmount(parseAmount(row.amount))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                type="button"
                size="sm"
                className="mt-3"
                disabled={submitting || selected.size === 0}
                onClick={() => void handleAttach()}
              >
                Attach selected ({selected.size})
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Releases cannot be changed after the run leaves Draft/Review.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
