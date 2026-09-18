'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  IntegratedSearchFilters,
  SEARCH_DEBOUNCE_MS,
  useDebouncedValue,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type FinancePeriod } from '@/features/finance/constants/finance';
import {
  FINANCE_DEFAULT_LIST_PERIOD,
  parseFinancePeriodFilterValue,
} from '@/features/finance/constants/finance-period-filter';
import {
  expensesApi,
  type Expense,
  type ExpenseListSortField,
  type ExpenseStats,
} from '@/lib/api/finance';
import { useRevalidationState } from '@/hooks/use-revalidation-state';
import { getApiErrorMessage, isAccessRevokedApiError } from '@/lib/api-errors';
import { OPEN_EXPENSE_QUERY } from '@/features/finance/constants/expense-deep-link';
import {
  EXPENSE_BACKLOG_FIXED_STATUS,
  EXPENSE_LIFECYCLE_SCOPE_QUERY,
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
import { useExpensePayrollEmployeeFilterOptions } from './use-expense-payroll-employee-filter-options';
import {
  EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY,
  EXPENSE_PAYROLL_EMPLOYEE_URL_QUERY,
  EXPENSE_PAYROLL_MONTH_FILTER_KEY,
  EXPENSE_PAYROLL_MONTH_URL_QUERY,
  EXPENSE_PAYROLL_PRESET_QUERY,
  EXPENSE_PAYROLL_SOURCE_FILTER_KEY,
  EXPENSE_PAYROLL_SOURCE_PAYROLL,
} from '@/features/finance/constants/expense-payroll-filter';
import { resolveExpensePayrollRunId } from '@/features/finance/utils/parse-payroll-expense-notes';
import {
  EXPENSE_BOARD_SCOPE_FILTER_KEY,
  EXPENSE_PERIOD_FILTER_KEY,
  EXPENSE_SORT_BY_FILTER_KEY,
  EXPENSE_SORT_ORDER_FILTER_KEY,
  expenseBoardPathForScope,
  expenseBoardScopeFromVariant,
} from './expense-board-scope';
import {
  EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY,
  expenseKanbanScopeFromBoardScope,
} from './expense-lifecycle-scope';
import {
  applyExpenseLifecycleScopeFilter,
  isExpenseLifecycleScopeQuery,
  mergePayNowFiltersForList,
  peekExpenseLifecycleScopeQuery,
  stripLegacyExpenseStatusFilter,
} from './ingest-expense-lifecycle-scope';
import { resolveBoardLifecycleScope } from '@/features/shared/board-lifecycle';
import { ExpensesPageSettingsSheet } from './ExpensesPageSettingsSheet';
import { useExpensesBoardViewMode } from '@/features/finance/constants/expenses-board-view';
import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';
import {
  SEARCH_FILTER_PAGE_ID,
  usePersistedSearchFilterField,
  usePersistedSearchFilters,
} from '@/lib/persisted-client-state';
import { ExpensesPageMainPanel } from './ExpensesPageMainPanel';
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
import { localizeExpenseFilterConfigs } from './localize-expense-filters';

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
  const t = useTranslations('expenses');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openExpenseIdFromUrl = searchParams.get(OPEN_EXPENSE_QUERY)?.trim() || null;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const { loading, begin: beginLoad, end: endLoad } = useRevalidationState();
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS).trim();
  const expenseFilterPageId =
    pageVariant === 'backlog'
      ? SEARCH_FILTER_PAGE_ID.financeExpensesBacklog
      : SEARCH_FILTER_PAGE_ID.financeExpenses;
  const [filters, setFilters] = usePersistedSearchFilters(
    expenseFilterPageId,
    initialExpenseFilterRecord(pageVariant),
  );
  const [view, handleViewChange] = useExpensesBoardViewMode();
  const displayView = useMobilePreferredView(view, 'kanban');
  const [periodRaw, setPeriodRaw] = usePersistedSearchFilterField(
    `${expenseFilterPageId}.period`,
    'period',
    FINANCE_DEFAULT_LIST_PERIOD,
  );
  const period = parseFinancePeriodFilterValue(periodRaw);
  const setPeriod = useCallback((next: FinancePeriod) => setPeriodRaw(next), [setPeriodRaw]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const projectFilterOptions = useExpenseProjectFilterOptions();
  const payrollEmployeeFilterOptions = useExpensePayrollEmployeeFilterOptions();
  const urlLifecycleScope =
    pageVariant === 'default'
      ? peekExpenseLifecycleScopeQuery(searchParams.get(EXPENSE_LIFECYCLE_SCOPE_QUERY))
      : null;
  const filtersForList = useMemo(
    () =>
      mergePayNowFiltersForList({
        filters,
        urlLifecycleScope,
        stripStatus: pageVariant === 'default',
      }),
    [filters, pageVariant, urlLifecycleScope],
  );
  const boardScope = resolveBoardLifecycleScope(filtersForList.boardScope);
  const isClosedLifecycle =
    pageVariant === 'closed' || (pageVariant === 'default' && boardScope === 'CLOSED');

  const listHrefOptions = useMemo((): ExpenseListHrefOptions => {
    return {
      fromBacklog: pageVariant === 'backlog',
      closed: isClosedLifecycle,
      lifecycleScope: pageVariant === 'default' ? boardScope : undefined,
      expensePlanId: expensePlanIdFromUrl?.trim() || undefined,
    };
  }, [boardScope, expensePlanIdFromUrl, isClosedLifecycle, pageVariant]);

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
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
  }, [projectIdFromUrl, setFilters]);

  const effectiveProjectId = useMemo(() => {
    if (projectIdFromUrl) return projectIdFromUrl;
    const fp = filters.project;
    return fp && fp !== 'all' ? fp : undefined;
  }, [projectIdFromUrl, filters.project]);

  const listApiParams = useMemo(
    () =>
      buildExpenseListApiParams({
        search: debouncedSearch,
        filters: filtersForList,
        period,
        effectiveProjectId,
        sortBy,
        sortOrder,
        pageVariant,
        expensePlanIdFromUrl,
        ignoreStatusFilter: pageVariant === 'default',
      }),
    [
      debouncedSearch,
      filtersForList,
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
  }, [onClearProjectFilter, pageVariant, setFilters]);

  const handleClearPlanDrilldown = useCallback(() => {
    replaceExpensesUrl((params) => {
      params.delete(EXPENSE_PLAN_DRILLDOWN_QUERY);
    });
  }, [replaceExpensesUrl]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (pageVariant === 'backlog' && key === 'status') {
        return;
      }
      if (key === EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY) {
        setFilters((prev) => applyExpenseLifecycleScopeFilter(prev, value));
        return;
      }
      if (projectIdFromUrl && key === 'project') {
        replaceExpensesUrl((params) => {
          params.delete(PROJECT_EXPENSES_DRILLDOWN_QUERY);
        });
      }
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [pageVariant, projectIdFromUrl, replaceExpensesUrl, setFilters],
  );

  const fetchExpenses = useCallback(async () => {
    beginLoad(expensesRef.current.length > 0);
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
      // A failed refresh keeps the cards already on screen, unless the server withdrew read
      // access: those cards must not survive a denial.
      if (isAccessRevokedApiError(caught)) {
        setExpenses([]);
        setStats(null);
      }
      setError(getApiErrorMessage(caught, t('errors.loadList')));
    } finally {
      endLoad();
    }
  }, [beginLoad, endLoad, listApiParams, t]);

  const handleExpenseKanbanMove = useExpenseKanbanStatusChange({
    listProjectId: effectiveProjectId ?? null,
    listSort: { sortBy, sortOrder },
    fromBacklog: pageVariant === 'backlog',
    closed: isClosedLifecycle,
    lifecycleScope: pageVariant === 'default' ? boardScope : undefined,
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
        toast.error(getApiErrorMessage(caught, t('errors.openLink')));
        stripOpenExpenseFromUrl();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openExpenseIdFromUrl, expenses, stripOpenExpenseFromUrl, t]);

  const onKanbanStatusMove = useCallback(
    async (expenseId: string, _from: string, toStatus: string) => {
      setError(null);
      await handleExpenseKanbanMove(expenseId, toStatus, expenses, async (updated) => {
        setExpenses((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        await fetchExpenses();
      });
    },
    [expenses, fetchExpenses, handleExpenseKanbanMove],
  );

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
      localizeExpenseFilterConfigs(
        buildExpenseIntegratedFilterConfigs(projectFilterOptions, payrollEmployeeFilterOptions, {
          omitStatus: true,
          includeLifecycleScope: pageVariant === 'default',
          includePayrollFilters: pageVariant === 'default',
        }),
        t,
      ),
    [payrollEmployeeFilterOptions, projectFilterOptions, pageVariant, t],
  );

  const viewOptions = useMemo(
    () =>
      EXPENSES_VIEW_OPTIONS.map((option) => ({
        ...option,
        label: t(`view.${option.value}`),
        ariaLabel: t(`view.${option.value}Aria`),
      })),
    [t],
  );

  useEffect(() => {
    if (pageVariant !== 'default') return;
    if (!Object.prototype.hasOwnProperty.call(filters, 'status')) return;
    setFilters((prev) => stripLegacyExpenseStatusFilter(prev));
  }, [filters, pageVariant, setFilters]);

  useEffect(() => {
    if (pageVariant !== 'default') return;
    const rawScope = searchParams.get(EXPENSE_LIFECYCLE_SCOPE_QUERY);
    const hasScope = isExpenseLifecycleScopeQuery(rawScope);
    const preset = searchParams.get(EXPENSE_PAYROLL_PRESET_QUERY) === '1';
    const monthFromUrl = searchParams.get(EXPENSE_PAYROLL_MONTH_URL_QUERY)?.trim();
    const employeeFromUrl = searchParams.get(EXPENSE_PAYROLL_EMPLOYEE_URL_QUERY)?.trim();
    if (!hasScope && !preset && !monthFromUrl && !employeeFromUrl) return;
    setFilters((prev) => {
      let next = prev;
      if (hasScope && rawScope) {
        next = applyExpenseLifecycleScopeFilter(next, rawScope);
      }
      if (!preset && !monthFromUrl && !employeeFromUrl) {
        return next;
      }
      const withPayroll = { ...next };
      if (preset) {
        withPayroll[EXPENSE_PAYROLL_SOURCE_FILTER_KEY] = EXPENSE_PAYROLL_SOURCE_PAYROLL;
      }
      if (monthFromUrl) {
        withPayroll[EXPENSE_PAYROLL_MONTH_FILTER_KEY] = monthFromUrl;
      }
      if (employeeFromUrl) {
        withPayroll[EXPENSE_PAYROLL_EMPLOYEE_FILTER_KEY] = employeeFromUrl;
      }
      return withPayroll;
    });
    replaceExpensesUrl((params) => {
      if (hasScope) {
        params.delete(EXPENSE_LIFECYCLE_SCOPE_QUERY);
      }
      if (preset || monthFromUrl || employeeFromUrl) {
        params.delete(EXPENSE_PAYROLL_PRESET_QUERY);
        params.delete(EXPENSE_PAYROLL_MONTH_URL_QUERY);
        params.delete(EXPENSE_PAYROLL_EMPLOYEE_URL_QUERY);
      }
    });
  }, [pageVariant, replaceExpensesUrl, searchParams, setFilters]);

  const payrollPaymentFocus = Boolean(
    selectedExpense && resolveExpensePayrollRunId(selectedExpense),
  );

  const integratedFilterValues = useMemo(
    () => ({
      [EXPENSE_BOARD_SCOPE_FILTER_KEY]: expenseBoardScopeFromVariant(pageVariant),
      [EXPENSE_LIFECYCLE_SCOPE_FILTER_KEY]: boardScope,
      [EXPENSE_PERIOD_FILTER_KEY]: period,
      [EXPENSE_SORT_BY_FILTER_KEY]: sortBy,
      [EXPENSE_SORT_ORDER_FILTER_KEY]: sortOrder,
      ...filters,
    }),
    [boardScope, filters, pageVariant, period, sortBy, sortOrder],
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
    [handleFilterChange, onSortByChange, onSortOrderChange, router, searchParams, setPeriod],
  );

  const clearFilters = useCallback(() => {
    setFilters(clearedExpenseFilterRecord(pageVariant, projectIdFromUrl));
    setPeriod(FINANCE_DEFAULT_LIST_PERIOD);
  }, [pageVariant, projectIdFromUrl, setFilters, setPeriod]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('searchPlaceholder')}
          filters={filterConfigs}
          filterValues={integratedFilterValues}
          onFilterChange={handleIntegratedFilterChange}
          onClearAll={clearFilters}
        />
      ),
      viewMode:
        pageVariant === 'backlog' ? undefined : (
          <ViewModeSwitch value={view} onChange={handleViewChange} options={viewOptions} />
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
          {isClosedLifecycle ? null : (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden />
              {t('actions.newExpense')}
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
      isClosedLifecycle,
      pageVariant,
      search,
      stats,
      t,
      view,
      viewOptions,
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
        onDismissError={() => setError(null)}
        expenses={expenses}
        view={pageVariant === 'backlog' ? 'list' : displayView}
        kanbanScope={
          pageVariant === 'default' ? expenseKanbanScopeFromBoardScope(boardScope) : 'active'
        }
        fromBacklog={pageVariant === 'backlog'}
        onOpenExpense={handleExpenseClick}
        onAddFirstExpense={isClosedLifecycle ? undefined : () => setCreateOpen(true)}
        onKanbanMove={
          pageVariant === 'default' && displayView === 'kanban' ? onKanbanStatusMove : undefined
        }
        onOpenQuickCreate={
          pageVariant === 'default' && displayView === 'kanban'
            ? () => setCreateOpen(true)
            : undefined
        }
      />

      <ExpenseDetailSheet
        expenseId={sheetOpen ? (openExpenseIdFromUrl ?? selectedExpense?.id ?? null) : null}
        initialExpense={selectedExpense}
        open={sheetOpen || Boolean(openExpenseIdFromUrl)}
        onOpenChange={handleExpenseSheetOpenChange}
        listProjectId={effectiveProjectId ?? null}
        listSort={{ sortBy, sortOrder }}
        listHrefOptions={listHrefOptions}
        payrollPaymentFocus={payrollPaymentFocus}
        onExpenseUpdated={handleExpenseUpdated}
        onExpenseDeleted={handleExpenseDeleted}
      />

      <ExpensesPageDialogs
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        defaultCreateStatus={pageVariant === 'backlog' ? EXPENSE_BACKLOG_FIXED_STATUS : undefined}
        onExpenseCreated={(created) => {
          void fetchExpenses().then(() => {
            handleExpenseClick(created);
          });
        }}
      />
    </div>
  );
}
