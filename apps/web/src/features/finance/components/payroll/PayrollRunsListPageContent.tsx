'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/shared';
import {
  PAYROLL_RUNS_LIST_MONTH_FROM_QUERY,
  PAYROLL_RUNS_LIST_MONTH_TO_QUERY,
  PAYROLL_RUNS_LIST_STATUS_QUERY,
  parsePayrollRunsListMonthParam,
  parsePayrollRunsListStatusParam,
} from '@/features/finance/constants/payroll-runs-list-url';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  payrollRunsApi,
  type PayrollRunListRow,
  type PayrollRunStats,
  type PayrollRunStatus,
} from '@/lib/api/payroll-runs';
import { payrollRunsListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { PayrollRunsCreateRunDialog } from '@/features/finance/components/payroll/PayrollRunsCreateRunDialog';
import { PayrollRunsListTable } from '@/features/finance/components/payroll/PayrollRunsListTable';
import { PayrollRunsListToolbar } from '@/features/finance/components/payroll/PayrollRunsListToolbar';
import { PayrollRunsScopeStatsCard } from '@/features/finance/components/payroll/PayrollRunsScopeStatsCard';
import { usePayrollRunsCsvExport } from '@/features/finance/components/payroll/use-payroll-runs-csv-export';

function defaultPayrollMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function PayrollRunsListPageContent() {
  useFinanceDocumentTitle(payrollRunsListPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<PayrollRunListRow[]>([]);
  const [stats, setStats] = useState<PayrollRunStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<PayrollRunStatus | 'ALL'>(() =>
    parsePayrollRunsListStatusParam(searchParams.get(PAYROLL_RUNS_LIST_STATUS_QUERY)),
  );
  const [monthFrom, setMonthFrom] = useState<string | undefined>(() =>
    parsePayrollRunsListMonthParam(searchParams.get(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY)),
  );
  const [monthTo, setMonthTo] = useState<string | undefined>(() =>
    parsePayrollRunsListMonthParam(searchParams.get(PAYROLL_RUNS_LIST_MONTH_TO_QUERY)),
  );

  useEffect(() => {
    setStatusFilter(
      parsePayrollRunsListStatusParam(searchParams.get(PAYROLL_RUNS_LIST_STATUS_QUERY)),
    );
    setMonthFrom(
      parsePayrollRunsListMonthParam(searchParams.get(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY)),
    );
    setMonthTo(parsePayrollRunsListMonthParam(searchParams.get(PAYROLL_RUNS_LIST_MONTH_TO_QUERY)));
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

  const listScope = useMemo(
    () => ({
      ...(statusFilter === 'ALL' ? {} : { status: statusFilter }),
      ...(monthFrom ? { payrollMonthFrom: monthFrom } : {}),
      ...(monthTo ? { payrollMonthTo: monthTo } : {}),
    }),
    [monthFrom, monthTo, statusFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, statsData] = await Promise.all([
        payrollRunsApi.getAll({
          pageSize: 100,
          sortBy: 'payrollMonth',
          sortOrder: 'desc',
          ...listScope,
        }),
        payrollRunsApi.getStats(listScope),
      ]);
      setItems(data.items);
      setStats(statsData);
    } catch (caught) {
      setStats(null);
      setItems([]);
      setError(getApiErrorMessage(caught, 'Payroll runs could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [listScope]);

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
      const tp = Number.parseFloat(row.totalPayable);
      const pd = Number.parseFloat(row.totalPaid);
      payable += Number.isFinite(tp) ? tp : 0;
      paid += Number.isFinite(pd) ? pd : 0;
      lines += row._count.salaryLines;
      materialized += row.materializedExpenseLineCount;
    }
    return { payable, paid, lines, materialized };
  }, [items]);

  const csvExportScope = useMemo(
    () => ({
      status: statusFilter,
      payrollMonthFrom: monthFrom,
      payrollMonthTo: monthTo,
    }),
    [monthFrom, monthTo, statusFilter],
  );

  const { exportCsvSubmitting, handleExportCsv } = usePayrollRunsCsvExport(csvExportScope);

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

  const handleMonthFromChange = useCallback(
    (value: string) => {
      const next = value ? value : undefined;
      setMonthFrom(next);
      replaceListUrl((params) => {
        if (!next) {
          params.delete(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY);
        } else {
          params.set(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY, next);
        }
      });
    },
    [replaceListUrl],
  );

  const handleMonthToChange = useCallback(
    (value: string) => {
      const next = value ? value : undefined;
      setMonthTo(next);
      replaceListUrl((params) => {
        if (!next) {
          params.delete(PAYROLL_RUNS_LIST_MONTH_TO_QUERY);
        } else {
          params.set(PAYROLL_RUNS_LIST_MONTH_TO_QUERY, next);
        }
      });
    },
    [replaceListUrl],
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Payroll"
        description="Monthly payroll runs (NBOS Draft → Closed workflow). Status and month bounds use the same filters as list, stats, and CSV export."
      >
        <PayrollRunsListToolbar
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          monthFrom={monthFrom}
          monthTo={monthTo}
          onMonthFromChange={handleMonthFromChange}
          onMonthToChange={handleMonthToChange}
          onRefresh={load}
          loading={loading}
          exportCsvSubmitting={exportCsvSubmitting}
          onExportCsv={handleExportCsv}
          onNewRun={openDialog}
        />
      </PageHeader>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : (
        <>
          <PayrollRunsScopeStatsCard stats={stats} loading={false} />
          {items.length === 0 ? (
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
            <PayrollRunsListTable items={items} pageTotals={pageTotals} />
          )}
        </>
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
