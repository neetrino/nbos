'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
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
import {
  buildPayrollIntegratedFilterConfigs,
  PAYROLL_FILTER_MONTH_FROM_KEY,
  PAYROLL_FILTER_MONTH_TO_KEY,
  PAYROLL_FILTER_STATUS_KEY,
} from '@/features/finance/components/payroll/build-payroll-integrated-filter-configs';
import { PayrollRunsPageSettingsSheet } from '@/features/finance/components/payroll/PayrollRunsPageSettingsSheet';
import { usePayrollRunsCsvExport } from '@/features/finance/components/payroll/use-payroll-runs-csv-export';
import { usePayrollRunsScopeStatsCsvExport } from '@/features/finance/components/payroll/use-payroll-runs-scope-stats-csv-export';
import { sumPayrollRunsRemainingMajorUnits } from '@/features/finance/utils/payroll-run-remaining-from-strings';

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
    return {
      payable,
      paid,
      remaining: sumPayrollRunsRemainingMajorUnits(items),
      lines,
      materialized,
    };
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
  const { handleExportScopeStatsCsv } = usePayrollRunsScopeStatsCsvExport(stats, csvExportScope);

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

  const payrollFilterConfigs = useMemo(() => buildPayrollIntegratedFilterConfigs(), []);

  const payrollFilterValues = useMemo(
    () => ({
      [PAYROLL_FILTER_STATUS_KEY]: statusFilter === 'ALL' ? 'all' : statusFilter,
      [PAYROLL_FILTER_MONTH_FROM_KEY]: monthFrom ?? 'all',
      [PAYROLL_FILTER_MONTH_TO_KEY]: monthTo ?? 'all',
    }),
    [monthFrom, monthTo, statusFilter],
  );

  const handlePayrollFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === PAYROLL_FILTER_STATUS_KEY) {
        handleStatusChange(value);
        return;
      }
      if (key === PAYROLL_FILTER_MONTH_FROM_KEY) {
        handleMonthFromChange(value === 'all' ? '' : value);
        return;
      }
      if (key === PAYROLL_FILTER_MONTH_TO_KEY) {
        handleMonthToChange(value === 'all' ? '' : value);
      }
    },
    [handleMonthFromChange, handleMonthToChange, handleStatusChange],
  );

  const handleClearPayrollFilters = useCallback(() => {
    setStatusFilter('ALL');
    setMonthFrom(undefined);
    setMonthTo(undefined);
    replaceListUrl((params) => {
      params.delete(PAYROLL_RUNS_LIST_STATUS_QUERY);
      params.delete(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY);
      params.delete(PAYROLL_RUNS_LIST_MONTH_TO_QUERY);
    });
  }, [replaceListUrl]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search=""
          onSearchChange={() => undefined}
          searchPlaceholder="Filter payroll runs…"
          filters={payrollFilterConfigs}
          filterValues={payrollFilterValues}
          onFilterChange={handlePayrollFilterChange}
          onClearAll={handleClearPayrollFilters}
        />
      ),
      trailing: (
        <>
          <PayrollRunsPageSettingsSheet
            refreshDisabled={loading}
            statsExportDisabled={loading || !stats}
            exportCsvDisabled={loading || exportCsvSubmitting}
            exportCsvInProgress={exportCsvSubmitting}
            onRefresh={load}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
            onExportCsv={handleExportCsv}
          />
          <Button type="button" onClick={openDialog}>
            <Plus size={16} className="mr-1.5" aria-hidden />
            New run
          </Button>
        </>
      ),
    }),
    [
      exportCsvSubmitting,
      handleClearPayrollFilters,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handlePayrollFilterChange,
      load,
      loading,
      openDialog,
      payrollFilterConfigs,
      payrollFilterValues,
      stats,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void load()} />
      ) : (
        <>
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
