'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, PieChart } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, useModuleHeroSlots } from '@/components/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { bonusBoardHref } from '@/features/finance/constants/bonus-board-url';
import { formatAmount } from '@/features/finance/constants/finance';
import { bonusProjectPoolsPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { useBonusProductPoolsCsvExport } from '@/features/finance/components/bonus/use-bonus-product-pools-csv-export';
import { BonusPoolsPageSettingsSheet } from '@/app/(app)/finance/bonus-pools/BonusPoolsPageSettingsSheet';
import { ProductBonusPoolSheet } from '@/features/finance/components/bonus/product-bonus-pool-sheet';
import { getApiErrorMessage } from '@/lib/api-errors';
import { sumMoneyStringsMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';
import { bonusesApi, type BonusProductPoolRow } from '@/lib/api/bonus';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function poolLedgerWarning(status: string | null): string | null {
  if (!status) return null;
  const upper = status.toUpperCase();
  if (upper.includes('OVER')) return 'Over funding — releases may exceed planned pool.';
  if (upper.includes('PARTIAL')) return 'Partial funding — carry-over or extra release may apply.';
  return null;
}

export function BonusPoolsPageContent() {
  useFinanceDocumentTitle(bonusProjectPoolsPageTitle());

  const [rows, setRows] = useState<BonusProductPoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [sheetPool, setSheetPool] = useState<BonusProductPoolRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const toggleExpanded = useCallback((poolKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(poolKey)) {
        next.delete(poolKey);
      } else {
        next.add(poolKey);
      }
      return next;
    });
  }, []);

  const openPoolSheet = useCallback((row: BonusProductPoolRow) => {
    setSheetPool(row);
    setSheetOpen(true);
  }, []);

  const moduleHeroSlots = useMemo(
    () => ({
      trailing: (
        <BonusPoolsPageSettingsSheet
          exportDisabled={loading || Boolean(error) || rows.length === 0}
          exportInProgress={exportCsvSubmitting}
          onExportCsv={handleExportCsv}
        />
      ),
    }),
    [error, exportCsvSubmitting, handleExportCsv, loading, rows.length],
  );

  useModuleHeroSlots(moduleHeroSlots);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No bonus entries yet"
        description="Once bonus lines exist on orders, product-level roll-ups appear here."
        action={null}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="border-border overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Pool</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Entries</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Pool status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const expanded = expandedKeys.has(row.poolKey);
              const warning = poolLedgerWarning(row.ledgerPoolStatus);
              return (
                <Fragment key={row.poolKey}>
                  <TableRow>
                    <TableCell>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground rounded p-1"
                        aria-expanded={expanded}
                        aria-label={expanded ? 'Collapse pool' : 'Expand pool'}
                        onClick={() => toggleExpanded(row.poolKey)}
                      >
                        {expanded ? (
                          <ChevronDown className="size-4" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4" aria-hidden />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground font-medium">{row.poolName}</span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {row.poolKey}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.poolKind}</TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${row.projectId}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {row.projectCode}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.orderCode}</TableCell>
                    <TableCell className="text-right">{row.entryCount}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatAmount(parseAmount(row.sumTotalAmount))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.ledgerPoolStatus ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openPoolSheet(row)}
                      >
                        Pool sheet
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded ? (
                    <TableRow key={`${row.poolKey}-detail`} className="bg-muted/20">
                      <TableCell colSpan={9} className="py-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <PoolMetric label="Pipeline" value={row.sumPipelineAmount} />
                          <PoolMetric label="Paid" value={row.sumPaidAmount} />
                          <PoolMetric label="Clawback" value={row.sumClawbackAmount} />
                          <PoolMetric label="Remaining" value={row.ledgerRemainingAmount} />
                        </div>
                        {warning ? (
                          <p className="text-destructive mt-2 text-xs">{warning}</p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Link
                            href={bonusBoardHref(row.projectId)}
                            className="text-primary text-sm font-medium hover:underline"
                          >
                            Bonus board (project)
                          </Link>
                          <button
                            type="button"
                            className="text-primary text-sm font-medium hover:underline"
                            onClick={() => openPoolSheet(row)}
                          >
                            Full pool sheet
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
          <tfoot>
            <TableRow className="bg-muted/30 font-medium">
              <TableCell colSpan={5} className="text-muted-foreground text-xs">
                All pools ({poolTotals.pools})
              </TableCell>
              <TableCell className="text-right tabular-nums">{poolTotals.entries}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(poolTotals.total)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </tfoot>
        </Table>
      </div>

      <ProductBonusPoolSheet
        pool={sheetPool}
        open={sheetOpen}
        onOpenChange={(next) => {
          setSheetOpen(next);
          if (!next) setSheetPool(null);
        }}
      />
    </div>
  );
}

function PoolMetric({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-border bg-card rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <p className="text-foreground mt-0.5 text-sm font-semibold tabular-nums">
        {value != null ? formatAmount(parseAmount(value)) : '—'}
      </p>
    </div>
  );
}
