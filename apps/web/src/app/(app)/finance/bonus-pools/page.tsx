'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, PieChart, RefreshCcw } from 'lucide-react';
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
import { getApiErrorMessage } from '@/lib/api-errors';
import { bonusesApi, type BonusProjectPoolRow } from '@/lib/api/bonus';
import { cn } from '@/lib/utils';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function BonusPoolsPage() {
  useFinanceDocumentTitle(bonusProjectPoolsPageTitle());

  const [rows, setRows] = useState<BonusProjectPoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bonusesApi.getProjectPools();
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

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Bonus pools (by project)"
        description="Read-only totals rolled up from bonus entries. Pipeline counts every status except Paid and Clawback."
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
        </div>
      </PageHeader>

      <p className="text-muted-foreground text-sm">
        Figures are aggregates over bonus entry rows; NBOS may introduce a dedicated project bonus
        pool entity later. This screen does not create separate ledger lines.
      </p>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No bonus entries yet"
          description="Once bonus lines exist per project, roll-ups appear here."
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
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Entries</TableHead>
                <TableHead className="text-right">Pipeline</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Clawback</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.projectId}>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
