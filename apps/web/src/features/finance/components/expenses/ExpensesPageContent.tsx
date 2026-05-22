'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { IntegratedSearchFilters, useModuleHeroSlots, ViewModeSwitch } from '@/components/shared';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type FinancePeriod } from '@/features/finance/constants/finance';
import {
  expensesApi,
  type Expense,
  type ExpenseListSortField,
  type ExpenseStats,
} from '@/lib/api/finance';
import { getApiErrorMessage } from '@/lib/api-errors';
import { OPEN_EXPENSE_QUERY } from '@/features/finance/constants/expense-deep-link';
import {
  EXPENSE_BACKLOG_FIXED_STATUS,
  EXPENSE_PLAN_DRILLDOWN_QUERY,
  PROJECT_EXPENSES_DRILLDOWN_QUERY,
  type ExpenseListHrefOptions,
} from '@/features/finance/constants/project-expenses-drilldown';
import { ExpenseDetailSheet } from '@/features/finance/components/expenses/ExpenseDetailSheet';
import {
  clearedExpenseFilterRecord,
  expenseFiltersWithoutProjectDrilldown,
  initialExpenseFilterRecord,
} from './expenses-page-filter-helpers';
import { ExpensePlanDrilldownBanner } from './ExpensePlanDrilldownBanner';
import { useExpensePlanBannerLabel } from './use-expense-plan-banner-label';
import { EXPENSES_VIEW_OPTIONS } from './expenses-view-options';
import { ExpensesPageDialogs } from './ExpensesPageDialogs';
import { ExpenseProjectDrilldownBanner } from './ExpenseProjectDrilldownBanner';
import { buildExpenseIntegratedFilterConfigs } from './build-expense-integrated-filter-configs';
import {
  EXPENSE_BOARD_SCOPE_FILTER_KEY,
  EXPENSE_PERIOD_FILTER_KEY,
  EXPENSE_SORT_BY_FILTER_KEY,
  EXPENSE_SORT_ORDER_FILTER_KEY,
  expenseBoardPathForScope,
  expenseBoardScopeFromVariant,
} from './expense-board-scope';
import { ExpensesPageSettingsSheet } from './ExpensesPageSettingsSheet';
import {
  readExpensesBoardViewMode,
  writeExpensesBoardViewMode,
} from '@/features/finance/constants/expenses-board-view';
import { ExpensesPageMainPanel, type ExpensesViewMode } from './ExpensesPageMainPanel';
import { useExpenseProjectFilterOptions } from './use-expense-project-filter-options';
import {
  buildExpenseListApiParams,
  EXPENSE_LIST_UI_PAGE_SIZE,
  pickExpenseStatsQueryParams,
} from '@/features/finance/utils/build-expense-list-api-params';
import { useExpenseCsvExport } from './use-expense-csv-export';
import { useExpensesScopeStatsCsvExport } from './use-expenses-scope-stats-csv-export';
import { useExpenseProjectBannerLabel } from './use-expense-project-banner-label';
import { useExpenseKanbanStatusChange } from './use-expense-kanban-status-change';

interface ExpensesPageContentProps {
  /** Backlog: deferred (`BACKLOG`). Closed: paid (`PAID`) off active board. Default: active board scope. */
  pageVariant?: 'default' | 'backlog' | 'closed';
  projectIdFromUrl: string | null;
  expensePlanIdFromUrl: string | null;
  onClearProjectFilter: () => void;
  replaceExpensesUrl: (mutate: (params: URLSearchParams) => void) => void;
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: ExpenseListSortField) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export function ExpensesPageContent({
  pageVariant = 'default',
  projectIdFromUrl,
  expensePlanIdFromUrl,
  onClearProjectFilter,
  replaceExpensesUrl,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: ExpensesPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openExpenseIdFromUrl = searchParams.get(OPEN_EXPENSE_QUERY)?.trim() || null;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    initialExpenseFilterRecord(pageVariant),
  );
  const [view, setView] = useState<ExpensesViewMode>(() => readExpensesBoardViewMode());

  const handleViewChange = useCallback((next: ExpensesViewMode) => {
    setView(next);
    writeExpensesBoardViewMode(next);
  }, []);
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const projectFilterOptions = useExpenseProjectFilterOptions();

  const listHrefOptions = useMemo((): ExpenseListHrefOptions => {
    return {
      fromBacklog: pageVariant === 'backlog',
      closed: pageVariant === 'closed',
      expensePlanId: expensePlanIdFromUrl?.trim() || undefined,
    };
  }, [expensePlanIdFromUrl, pageVariant]);

  const stripOpenExpenseFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(OPEN_EXPENSE_QUERY)) return;
    params.delete(OPEN_EXPENSE_QUERY);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const pushOpenExpenseToUrl = useCallback(
    (expenseId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_EXPENSE_QUERY, expenseId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleExpenseClick = useCallback(
    (expense: Expense) => {
      setSelectedExpense(expense);
      setSheetOpen(true);
      pushOpenExpenseToUrl(expense.id);
    },
    [pushOpenExpenseToUrl],
  );

  const handleExpenseSheetOpenChange = useCallback(
    (nextOpen: boolean) => {
      setSheetOpen(nextOpen);
      if (!nextOpen) {
        setSelectedExpense(null);
        stripOpenExpenseFromUrl();
      }
    },
    [stripOpenExpenseFromUrl],
  );

  const handleExpenseUpdated = useCallback((updated: Expense) => {
    setSelectedExpense(updated);
    setExpenses((current) => current.map((row) => (row.id === updated.id ? updated : row)));
  }, []);

  useEffect(() => {
    if (projectIdFromUrl) {
      setFilters((prev) => ({ ...prev, project: projectIdFromUrl }));
    }
  }, [projectIdFromUrl]);

  const effectiveProjectId = useMemo(() => {
    if (projectIdFromUrl) return projectIdFromUrl;
    const fp = filters.project;
    return fp && fp !== 'all' ? fp : undefined;
  }, [projectIdFromUrl, filters.project]);

  const listApiParams = useMemo(
    () =>
      buildExpenseListApiParams({
        search,
        filters,
        period,
        effectiveProjectId,
        sortBy,
        sortOrder,
        pageVariant,
        expensePlanIdFromUrl,
      }),
    [
      search,
      filters,
      period,
      effectiveProjectId,
      sortBy,
      sortOrder,
      pageVariant,
      expensePlanIdFromUrl,
    ],
  );

  const { exportCsvSubmitting, handleExportCsv } = useExpenseCsvExport(listApiParams);

  const expenseStatsQueryParams = useMemo(
    () => pickExpenseStatsQueryParams(listApiParams),
    [listApiParams],
  );

  const { handleExportScopeStatsCsv } = useExpensesScopeStatsCsvExport(stats, {
    period,
    statsQuery: expenseStatsQueryParams,
  });

  const projectBannerLabel = useExpenseProjectBannerLabel(projectIdFromUrl);
  const planBannerLabel = useExpensePlanBannerLabel(expensePlanIdFromUrl);

  const handleClearProjectDrilldown = useCallback(() => {
    setFilters((prev) => expenseFiltersWithoutProjectDrilldown(prev, pageVariant));
    onClearProjectFilter();
  }, [onClearProjectFilter, pageVariant]);

  const handleClearPlanDrilldown = useCallback(() => {
    replaceExpensesUrl((params) => {
      params.delete(EXPENSE_PLAN_DRILLDOWN_QUERY);
    });
  }, [replaceExpensesUrl]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if ((pageVariant === 'backlog' || pageVariant === 'closed') && key === 'status') {
        return;
      }
      if (projectIdFromUrl && key === 'project') {
        replaceExpensesUrl((params) => {
          params.delete(PROJECT_EXPENSES_DRILLDOWN_QUERY);
        });
      }
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [pageVariant, projectIdFromUrl, replaceExpensesUrl],
  );

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [data, expenseStats] = await Promise.all([
        expensesApi.getAll({
          ...listApiParams,
          pageSize: EXPENSE_LIST_UI_PAGE_SIZE,
        }),
        expensesApi.getStats(pickExpenseStatsQueryParams(listApiParams)),
      ]);
      setExpenses(data.items);
      setStats(expenseStats);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(
          caught,
          'Expenses could not be loaded. Check your connection and try again.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [listApiParams]);

  const handleExpenseKanbanMove = useExpenseKanbanStatusChange({
    listProjectId: effectiveProjectId ?? null,
    listSort: { sortBy, sortOrder },
    fromBacklog: pageVariant === 'backlog',
    closed: pageVariant === 'closed',
    expensePlanId: expensePlanIdFromUrl?.trim() ?? null,
  });

  const handleExpenseDeleted = useCallback(
    (expenseId: string) => {
      setExpenses((current) => current.filter((row) => row.id !== expenseId));
      void fetchExpenses();
    },
    [fetchExpenses],
  );

  useEffect(() => {
    if (!openExpenseIdFromUrl) return;
    const fromList = expenses.find((row) => row.id === openExpenseIdFromUrl);
    if (fromList) {
      setSelectedExpense(fromList);
      setSheetOpen(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await expensesApi.getById(openExpenseIdFromUrl);
        if (!cancelled) {
          setSelectedExpense(data);
          setSheetOpen(true);
        }
      } catch (caught) {
        toast.error(getApiErrorMessage(caught, 'Could not open expense from link.'));
        stripOpenExpenseFromUrl();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openExpenseIdFromUrl, expenses, stripOpenExpenseFromUrl]);

  const onKanbanStatusMove = useCallback(
    async (expenseId: string, _from: string, toStatus: string) => {
      setError(null);
      await handleExpenseKanbanMove(expenseId, toStatus, expenses, fetchExpenses);
    },
    [expenses, fetchExpenses, handleExpenseKanbanMove],
  );

  const handleConfirmDeleteExpense = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await expensesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchExpenses();
    } catch (caught) {
      setDeleteError(
        getApiErrorMessage(
          caught,
          'Expense could not be deleted. Check your connection and try again.',
        ),
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void fetchExpenses();
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [fetchExpenses]);

  const filterConfigs = useMemo(
    () =>
      buildExpenseIntegratedFilterConfigs(projectFilterOptions, {
        omitStatus: pageVariant === 'backlog' || pageVariant === 'closed',
      }),
    [projectFilterOptions, pageVariant],
  );

  const integratedFilterValues = useMemo(
    () => ({
      [EXPENSE_BOARD_SCOPE_FILTER_KEY]: expenseBoardScopeFromVariant(pageVariant),
      [EXPENSE_PERIOD_FILTER_KEY]: period,
      [EXPENSE_SORT_BY_FILTER_KEY]: sortBy,
      [EXPENSE_SORT_ORDER_FILTER_KEY]: sortOrder,
      ...filters,
    }),
    [filters, pageVariant, period, sortBy, sortOrder],
  );

  const handleIntegratedFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === EXPENSE_BOARD_SCOPE_FILTER_KEY) {
        const path = expenseBoardPathForScope(value);
        const q = searchParams.toString();
        router.push(q ? `${path}?${q}` : path);
        return;
      }
      if (key === EXPENSE_PERIOD_FILTER_KEY) {
        setPeriod(value as FinancePeriod);
        return;
      }
      if (key === EXPENSE_SORT_BY_FILTER_KEY) {
        onSortByChange(value as ExpenseListSortField);
        return;
      }
      if (key === EXPENSE_SORT_ORDER_FILTER_KEY) {
        if (value === 'asc' || value === 'desc') {
          onSortOrderChange(value);
        }
        return;
      }
      handleFilterChange(key, value);
    },
    [handleFilterChange, onSortByChange, onSortOrderChange, router, searchParams],
  );

  const clearFilters = useCallback(() => {
    setFilters(clearedExpenseFilterRecord(pageVariant, projectIdFromUrl));
    setPeriod('month');
  }, [pageVariant, projectIdFromUrl]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, notes, project, plan…"
          filters={filterConfigs}
          filterValues={integratedFilterValues}
          onFilterChange={handleIntegratedFilterChange}
          onClearAll={clearFilters}
        />
      ),
      viewMode:
        pageVariant === 'backlog' ? undefined : (
          <ViewModeSwitch
            value={view}
            onChange={handleViewChange}
            options={EXPENSES_VIEW_OPTIONS}
          />
        ),
      trailing: (
        <>
          <ExpensesPageSettingsSheet
            statsExportDisabled={loading || !stats}
            exportCsvDisabled={loading || exportCsvSubmitting}
            exportCsvInProgress={exportCsvSubmitting}
            onExportScopeStatsCsv={handleExportScopeStatsCsv}
            onExportCsv={handleExportCsv}
          />
          {pageVariant === 'closed' ? null : (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden />
              New Expense
            </Button>
          )}
        </>
      ),
    }),
    [
      clearFilters,
      exportCsvSubmitting,
      filterConfigs,
      handleExportCsv,
      handleExportScopeStatsCsv,
      handleIntegratedFilterChange,
      handleViewChange,
      integratedFilterValues,
      loading,
      pageVariant,
      search,
      stats,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {projectIdFromUrl ? (
        <ExpenseProjectDrilldownBanner
          projectId={projectIdFromUrl}
          projectBannerLabel={projectBannerLabel}
          onClearProjectFilter={handleClearProjectDrilldown}
        />
      ) : null}

      {expensePlanIdFromUrl?.trim() ? (
        <ExpensePlanDrilldownBanner
          expensePlanId={expensePlanIdFromUrl.trim()}
          planBannerLabel={planBannerLabel}
          onClearPlanFilter={handleClearPlanDrilldown}
        />
      ) : null}

      <ExpensesPageMainPanel
        loading={loading}
        error={error}
        onRetry={fetchExpenses}
        expenses={expenses}
        view={pageVariant === 'backlog' ? 'list' : view}
        kanbanScope={pageVariant === 'closed' ? 'closed' : 'active'}
        fromBacklog={pageVariant === 'backlog'}
        onOpenExpense={handleExpenseClick}
        onRequestDelete={(row) => {
          setDeleteError(null);
          setDeleteTarget(row);
        }}
        onAddFirstExpense={() => setCreateOpen(true)}
        onKanbanMove={
          pageVariant === 'default' && view === 'kanban' ? onKanbanStatusMove : undefined
        }
        onOpenQuickCreate={
          pageVariant === 'default' && view === 'kanban' ? () => setCreateOpen(true) : undefined
        }
      />

      <ExpenseDetailSheet
        expenseId={sheetOpen ? (openExpenseIdFromUrl ?? selectedExpense?.id ?? null) : null}
        open={sheetOpen || Boolean(openExpenseIdFromUrl)}
        onOpenChange={handleExpenseSheetOpenChange}
        listProjectId={effectiveProjectId ?? null}
        listSort={{ sortBy, sortOrder }}
        listHrefOptions={listHrefOptions}
        onExpenseUpdated={handleExpenseUpdated}
        onExpenseDeleted={handleExpenseDeleted}
      />

      <ExpensesPageDialogs
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        effectiveProjectId={effectiveProjectId ?? null}
        defaultCreateStatus={pageVariant === 'backlog' ? EXPENSE_BACKLOG_FIXED_STATUS : undefined}
        onExpenseCreated={(created) => {
          void fetchExpenses().then(() => {
            handleExpenseClick(created);
          });
        }}
        deleteTarget={deleteTarget}
        deleteSubmitting={deleteSubmitting}
        deleteError={deleteError}
        onDeleteOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirmDeleteExpense={handleConfirmDeleteExpense}
      />
    </div>
  );
}
