'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { EmployeeMonthCompensationSheet } from '@/features/finance/components/payroll/employee-month-compensation-sheet';
import { SALARY_BOARD_OPEN_LINE_QUERY } from '@/features/finance/constants/salary-board-url';
import {
  readSalaryBoardViewMode,
  writeSalaryBoardViewMode,
  type SalaryBoardViewMode,
} from '@/features/finance/constants/salary-board-view';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { salaryBoardPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import {
  PAYROLL_RUNS_LIST_MONTH_FROM_QUERY,
  PAYROLL_RUNS_LIST_MONTH_TO_QUERY,
  parsePayrollRunsListMonthParam,
} from '@/features/finance/constants/payroll-runs-list-url';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi, type SalaryBoardResponse } from '@/lib/api/payroll-runs';
import {
  buildPayrollMonthRangeFilterConfigs,
  PAYROLL_FILTER_MONTH_FROM_KEY,
  PAYROLL_FILTER_MONTH_TO_KEY,
} from '@/features/finance/components/payroll/build-payroll-integrated-filter-configs';
import {
  buildSalaryBoardClientFilterConfigs,
  SALARY_BOARD_EMPLOYEE_FILTER_KEY,
  SALARY_BOARD_LINE_STATUS_FILTER_KEY,
  SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY,
} from '@/features/finance/components/payroll/build-salary-board-client-filter-configs';
import {
  employeeDisplayName,
  filterSalaryBoardEntries,
  filterSalaryBoardRows,
  flattenSalaryBoard,
} from '@/features/finance/components/payroll/salary-board-entries';
import { SalaryBoardCardsView } from '@/features/finance/components/payroll/salary-board-cards-view';
import { SalaryBoardGridView } from '@/features/finance/components/payroll/salary-board-grid-view';
import { SalaryBoardListView } from '@/features/finance/components/payroll/salary-board-list-view';
import { SalaryBoardPayoutBoardView } from '@/features/finance/components/payroll/salary-board-payout-board-view';
import { SALARY_BOARD_VIEW_OPTIONS } from '@/features/finance/components/payroll/salary-board-view-options';
import { SalaryBoardPageSettingsSheet } from '@/features/finance/components/payroll/SalaryBoardPageSettingsSheet';
import { SalaryBoardFilteredTotalsBar } from '@/features/finance/components/payroll/salary-board-filtered-totals-bar';
import { useSalaryBoardCsvExport } from '@/features/finance/components/payroll/use-salary-board-csv-export';
import { computeSalaryBoardFilteredTotals } from '@/features/finance/utils/salary-board-filtered-totals';

function salaryLineExistsOnBoard(board: SalaryBoardResponse, salaryLineId: string): boolean {
  return board.rows.some((row) => row.cells.some((cell) => cell?.salaryLineId === salaryLineId));
}

const INITIAL_CLIENT_FILTERS: Record<string, string> = {
  [SALARY_BOARD_EMPLOYEE_FILTER_KEY]: 'all',
  [SALARY_BOARD_LINE_STATUS_FILTER_KEY]: 'all',
  [SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY]: 'all',
};

export function SalaryBoardPageContent() {
  useFinanceDocumentTitle(salaryBoardPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<SalaryBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [clientFilters, setClientFilters] = useState(INITIAL_CLIENT_FILTERS);
  const [view, setView] = useState<SalaryBoardViewMode>(() => readSalaryBoardViewMode());

  const monthFrom = parsePayrollRunsListMonthParam(
    searchParams.get(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY),
  );
  const monthTo = parsePayrollRunsListMonthParam(
    searchParams.get(PAYROLL_RUNS_LIST_MONTH_TO_QUERY),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const board = await payrollRunsApi.getSalaryBoard({
        payrollMonthFrom: monthFrom,
        payrollMonthTo: monthTo,
      });
      setData(board);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load salary board'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [monthFrom, monthTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleViewChange = useCallback((next: SalaryBoardViewMode) => {
    setView(next);
    writeSalaryBoardViewMode(next);
  }, []);

  const employeeOptions = useMemo(() => {
    if (!data) return [];
    return data.rows.map((row) => ({
      id: row.employee.id,
      label: employeeDisplayName(row.employee),
    }));
  }, [data]);

  const clientFilterState = useMemo(
    () => ({
      search,
      employeeId: clientFilters[SALARY_BOARD_EMPLOYEE_FILTER_KEY] ?? 'all',
      lineStatus: clientFilters[SALARY_BOARD_LINE_STATUS_FILTER_KEY] ?? 'all',
      payoutPhase: clientFilters[SALARY_BOARD_PAYOUT_PHASE_FILTER_KEY] ?? 'all',
    }),
    [clientFilters, search],
  );

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    return filterSalaryBoardEntries(flattenSalaryBoard(data), clientFilterState);
  }, [clientFilterState, data]);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return filterSalaryBoardRows(data, clientFilterState);
  }, [clientFilterState, data]);

  const salaryFilterConfigs = useMemo(
    () => [
      ...buildPayrollMonthRangeFilterConfigs(),
      ...buildSalaryBoardClientFilterConfigs(employeeOptions),
    ],
    [employeeOptions],
  );

  const salaryFilterValues = useMemo(
    () => ({
      [PAYROLL_FILTER_MONTH_FROM_KEY]: monthFrom ?? 'all',
      [PAYROLL_FILTER_MONTH_TO_KEY]: monthTo ?? 'all',
      ...clientFilters,
    }),
    [clientFilters, monthFrom, monthTo],
  );

  const replaceSalaryBoardUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handleSalaryFilterChange = useCallback(
    (key: string, value: string) => {
      const monthValue = value === 'all' ? undefined : value;
      if (key === PAYROLL_FILTER_MONTH_FROM_KEY) {
        replaceSalaryBoardUrl((params) => {
          if (!monthValue) params.delete(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY);
          else params.set(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY, monthValue);
        });
        return;
      }
      if (key === PAYROLL_FILTER_MONTH_TO_KEY) {
        replaceSalaryBoardUrl((params) => {
          if (!monthValue) params.delete(PAYROLL_RUNS_LIST_MONTH_TO_QUERY);
          else params.set(PAYROLL_RUNS_LIST_MONTH_TO_QUERY, monthValue);
        });
        return;
      }
      setClientFilters((prev) => ({ ...prev, [key]: value }));
    },
    [replaceSalaryBoardUrl],
  );

  const handleClearSalaryFilters = useCallback(() => {
    replaceSalaryBoardUrl((params) => {
      params.delete(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY);
      params.delete(PAYROLL_RUNS_LIST_MONTH_TO_QUERY);
    });
    setSearch('');
    setClientFilters(INITIAL_CLIENT_FILTERS);
  }, [replaceSalaryBoardUrl]);

  const openSalaryLineId = searchParams.get(SALARY_BOARD_OPEN_LINE_QUERY)?.trim() || null;
  const monthSheetOpen = Boolean(openSalaryLineId);

  const openMonthSheet = useCallback(
    (salaryLineId: string) => {
      replaceSalaryBoardUrl((params) => {
        params.set(SALARY_BOARD_OPEN_LINE_QUERY, salaryLineId);
      });
    },
    [replaceSalaryBoardUrl],
  );

  const handleMonthSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      replaceSalaryBoardUrl((params) => {
        params.delete(SALARY_BOARD_OPEN_LINE_QUERY);
      });
    },
    [replaceSalaryBoardUrl],
  );

  useEffect(() => {
    if (loading || !openSalaryLineId || !data) return;
    if (!salaryLineExistsOnBoard(data, openSalaryLineId)) {
      replaceSalaryBoardUrl((params) => {
        params.delete(SALARY_BOARD_OPEN_LINE_QUERY);
      });
    }
  }, [data, loading, openSalaryLineId, replaceSalaryBoardUrl]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search employees…"
          filters={salaryFilterConfigs}
          filterValues={salaryFilterValues}
          onFilterChange={handleSalaryFilterChange}
          onClearAll={handleClearSalaryFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={view}
          onChange={handleViewChange}
          options={SALARY_BOARD_VIEW_OPTIONS}
        />
      ),
    }),
    [
      handleClearSalaryFilters,
      handleSalaryFilterChange,
      handleViewChange,
      salaryFilterConfigs,
      salaryFilterValues,
      search,
      view,
    ],
  );

  const filteredTotals = useMemo(
    () => computeSalaryBoardFilteredTotals(filteredEntries),
    [filteredEntries],
  );

  const { exportCsvSubmitting, handleExportCsv } = useSalaryBoardCsvExport(filteredEntries, {
    monthFrom,
    monthTo,
  });

  const moduleHeroSlotsWithExport = useMemo(
    () => ({
      ...moduleHeroSlots,
      trailing: (
        <SalaryBoardPageSettingsSheet
          exportCsvDisabled={exportCsvSubmitting || filteredEntries.length === 0}
          exportCsvInProgress={exportCsvSubmitting}
          onExportCsv={handleExportCsv}
        />
      ),
    }),
    [exportCsvSubmitting, filteredEntries.length, handleExportCsv, moduleHeroSlots],
  );

  useModuleHeroSlots(moduleHeroSlotsWithExport);

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (!data) {
    return (
      <EmptyState icon={Users} title="No data" description="Salary data response was empty." />
    );
  }

  const hasVisibleLines = filteredEntries.length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-6">
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {data.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees"
          description="No non-terminated employees are available for the salary view."
        />
      ) : !hasVisibleLines ? (
        <EmptyState
          icon={Users}
          title="No matching lines"
          description="Adjust search or filters to see salary lines."
        />
      ) : (
        <>
          <SalaryBoardFilteredTotalsBar totals={filteredTotals} />
          {view === 'grid' ? (
            <SalaryBoardGridView data={data} rows={filteredRows} onOpenMonth={openMonthSheet} />
          ) : view === 'cards' ? (
            <SalaryBoardCardsView data={data} rows={filteredRows} onOpenMonth={openMonthSheet} />
          ) : view === 'list' ? (
            <SalaryBoardListView
              entries={filteredEntries}
              totals={filteredTotals}
              onOpenMonth={openMonthSheet}
            />
          ) : (
            <SalaryBoardPayoutBoardView entries={filteredEntries} onOpenMonth={openMonthSheet} />
          )}
        </>
      )}

      <EmployeeMonthCompensationSheet
        salaryLineId={openSalaryLineId}
        open={monthSheetOpen}
        onOpenChange={handleMonthSheetOpenChange}
      />
    </div>
  );
}
