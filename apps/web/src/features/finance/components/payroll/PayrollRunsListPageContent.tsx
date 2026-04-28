'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  PAYROLL_RUNS_LIST_STATUS_QUERY,
  parsePayrollRunsListStatusParam,
} from '@/features/finance/constants/payroll-runs-list-url';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunListRow,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';
import { payrollRunsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PayrollRunsCreateRunDialog } from '@/features/finance/components/payroll/PayrollRunsCreateRunDialog';
import { usePayrollRunsCsvExport } from '@/features/finance/components/payroll/use-payroll-runs-csv-export';

const STATUS_OPTIONS: PayrollRunStatus[] = ['DRAFT', 'REVIEW', 'APPROVED', 'PAYING', 'CLOSED'];

function defaultPayrollMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function PayrollRunsListPageContent() {
  useFinanceDocumentTitle(payrollRunsListPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<PayrollRunListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | 'ALL'>(() =>
    parsePayrollRunsListStatusParam(searchParams.get(PAYROLL_RUNS_LIST_STATUS_QUERY)),
  );

  useEffect(() => {
    setStatusFilter(
      parsePayrollRunsListStatusParam(searchParams.get(PAYROLL_RUNS_LIST_STATUS_QUERY)),
    );
  }, [searchParams]);

  const replaceListUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await payrollRunsApi.getAll({
        pageSize: 100,
        sortBy: 'payrollMonth',
        sortOrder: 'desc',
        ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      });
      setItems(data.items);
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Payroll runs could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const defaultMonthValue = useMemo(() => defaultPayrollMonth(), []);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const pageTotals = useMemo(() => {
    let payable = 0;
    let paid = 0;
    let lines = 0;
    let materialized = 0;
    for (const row of items) {
      payable += parseAmount(row.totalPayable);
      paid += parseAmount(row.totalPaid);
      lines += row._count.salaryLines;
      materialized += row.materializedExpenseLineCount;
    }
    return { payable, paid, lines, materialized };
  }, [items]);

  const { exportCsvSubmitting, handleExportCsv } = usePayrollRunsCsvExport(statusFilter);

  const handleStatusChange = useCallback(
    (value: string) => {
      const next = value === 'ALL' ? 'ALL' : (value as PayrollRunStatus);
      setStatusFilter(next);
      replaceListUrl((params) => {
        if (next === 'ALL') {
          params.delete(PAYROLL_RUNS_LIST_STATUS_QUERY);
        } else {
          params.set(PAYROLL_RUNS_LIST_STATUS_QUERY, next);
        }
      });
    },
    [replaceListUrl],
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Payroll"
        description="Monthly payroll runs (NBOS Draft → Closed workflow). Filter by status matches the list API."
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Filter by run status"
              className="border-input bg-card text-foreground focus:ring-ring h-9 rounded-md border px-3 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {PAYROLL_RUN_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCcw size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading || exportCsvSubmitting}
            onClick={() => {
              void handleExportCsv();
            }}
            aria-label="Export payroll runs as CSV"
            title="Export all runs matching current status filter (paginated fetch)"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Download size={16} aria-hidden />
            )}
          </Button>
          <Button onClick={openDialog}>
            <Plus size={16} className="mr-1.5" />
            New run
          </Button>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No payroll runs in this scope"
          description={
            statusFilter === 'ALL'
              ? 'Create a run for a calendar month. Salary lines can be seeded from employee base salaries.'
              : `No runs with status “${PAYROLL_RUN_STATUS_LABEL[statusFilter]}”. Try another filter or create a new run.`
          }
          action={
            <Button type="button" onClick={openDialog}>
              New run
            </Button>
          }
        />
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Expense cards</TableHead>
                <TableHead className="text-right">Total payable</TableHead>
                <TableHead className="text-right">Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/finance/payroll/${row.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {row.payrollMonth}
                    </Link>
                  </TableCell>
                  <TableCell>{PAYROLL_RUN_STATUS_LABEL[row.status]}</TableCell>
                  <TableCell className="text-right">{row._count.salaryLines}</TableCell>
                  <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                    {row.materializedExpenseLineCount} / {row._count.salaryLines}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.totalPayable))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatAmount(parseAmount(row.totalPaid))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <tfoot>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={2} className="text-muted-foreground text-xs">
                  Page totals ({items.length} run{items.length === 1 ? '' : 's'})
                </TableCell>
                <TableCell className="text-right tabular-nums">{pageTotals.lines}</TableCell>
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">
                  {pageTotals.materialized}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(pageTotals.payable)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(pageTotals.paid)}
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
      )}

      <PayrollRunsCreateRunDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultMonth={defaultMonthValue}
        onCreated={() => load()}
      />
    </div>
  );
}
