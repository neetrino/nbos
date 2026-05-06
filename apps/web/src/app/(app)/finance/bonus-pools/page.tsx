'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, Loader2, PieChart, RefreshCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusProjectPoolsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { useBonusProductPoolsCsvExport } from '@/features/finance/components/bonus/use-bonus-product-pools-csv-export';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { getApiErrorMessage } from '@/lib/api-errors';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import { bonusesApi, type BonusProductPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function BonusPoolsPage() {
  useFinanceDocumentTitle(bonusProjectPoolsPageTitle());

  const [rows, setRows] = useState<BonusProductPoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { exportCsvSubmitting, handleExportCsv } = useBonusProductPoolsCsvExport(rows);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bonusesApi.getProductPools();
      setRows(data);
    } catch (caught) {
      setRows([]);
      setError(getApiErrorMessage(caught, 'Bonus pool roll-ups could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const poolTotals = useMemo(() => {
    return {
      pools: rows.length,
      entries: rows.reduce((acc, r) => acc + r.entryCount, 0),
      pipeline: sumMoneyStringsMajorUnits(rows.map((r) => r.sumPipelineAmount)),
      paid: sumMoneyStringsMajorUnits(rows.map((r) => r.sumPaidAmount)),
      clawback: sumMoneyStringsMajorUnits(rows.map((r) => r.sumClawbackAmount)),
      total: sumMoneyStringsMajorUnits(rows.map((r) => r.sumTotalAmount)),
    };
  }, [rows]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Bonus pools (by product)"
        description="Read-only totals rolled up by Product / Extension (or order fallback), aligned with NBOS Product Bonus Pool. Pipeline counts every status except Paid and Clawback."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/bonus"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex')}
          >
            Bonus board
            <ExternalLink size={14} className="ml-1.5" />
          </Link>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCcw size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading || Boolean(error) || rows.length === 0 || exportCsvSubmitting}
            onClick={() => handleExportCsv()}
            aria-label="Export bonus product pools as CSV"
            title="UTF-8 CSV of roll-up rows plus a final grand-total row (GET /api/bonus/products/pools)"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Download size={16} aria-hidden />
            )}
          </Button>
        </div>
      </PageHeader>

      <p className="text-muted-foreground text-sm">
        Figures aggregate bonus entry rows by the order&apos;s linked product or extension. Use the
        bonus board filtered by project for delivery context (**`/bonus?projectId=`**).
      </p>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No bonus entries yet"
          description="Once bonus lines exist on orders, product-level roll-ups appear here."
          action={
            <Link
              href="/bonus"
              className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex')}
            >
              Open bonus board
            </Link>
          }
        />
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Bonus board</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Pipeline</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Clawback</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pool planned</TableHead>
                <TableHead className="text-right">Released</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Funding</TableHead>
                <TableHead>Pool status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.poolKey}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-foreground font-medium">{row.poolName}</span>
                      <span className="text-muted-foreground font-mono text-xs">{row.poolKey}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.poolKind}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/projects/${row.projectId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {row.projectCode}
                      </Link>
                      <span className="text-muted-foreground text-xs">{row.projectName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.orderCode}</TableCell>
                  <TableCell>
                    <Link
                      href={bonusBoardHref(row.projectId)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Filtered board
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{row.entryCount}</TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.sumPipelineAmount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.sumPaidAmount))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.sumClawbackAmount))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatAmount(parseAmount(row.sumTotalAmount))}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {row.ledgerPlannedAmount != null
                      ? formatAmount(parseAmount(row.ledgerPlannedAmount))
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {row.ledgerReleasedAmount != null
                      ? formatAmount(parseAmount(row.ledgerReleasedAmount))
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {row.ledgerRemainingAmount != null
                      ? formatAmount(parseAmount(row.ledgerRemainingAmount))
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right tabular-nums">
                    {row.ledgerAvailableFunding != null
                      ? formatAmount(parseAmount(row.ledgerAvailableFunding))
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.ledgerPoolStatus ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <tfoot>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={5} className="text-muted-foreground text-xs">
                  All pools ({poolTotals.pools})
                </TableCell>
                <TableCell className="text-right tabular-nums">{poolTotals.entries}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(poolTotals.pipeline)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(poolTotals.paid)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(poolTotals.clawback)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(poolTotals.total)}
                </TableCell>
                <TableCell colSpan={5} className="text-muted-foreground text-xs">
                  Per-order ledger totals are not summed here.
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
      )}
    </div>
  );
}
