'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useDebouncedValue,
  useModuleHeroSlots,
  ViewModeSwitch,
} from '@/components/shared';
import {
  EXPENSE_PLANS_LIST_CATEGORY_QUERY,
  EXPENSE_PLANS_LIST_PROJECT_QUERY,
  EXPENSE_PLANS_LIST_SEARCH_QUERY,
  EXPENSE_PLANS_LIST_STATUS_QUERY,
  EXPENSE_PLANS_LIST_YEAR_QUERY,
} from '@/features/finance/constants/expense-plans-list-url';
import { EXPENSE_PLAN_STATUS_FILTER_ACTIVE } from '@/features/finance/constants/expense-plan-status';
import {
  useExpensePlansViewMode,
  type ExpensePlansViewMode,
} from '@/features/finance/constants/expense-plans-view';
import { CreateExpensePlanDialog } from '@/features/finance/components/expenses/CreateExpensePlanDialog';
import { ExpensePlanCoverageGrid } from '@/features/finance/components/expenses/ExpensePlanCoverageGrid';
import { ExpensePlansBoard } from '@/features/finance/components/expenses/ExpensePlansBoard';
import { ExpensePlansListTable } from '@/features/finance/components/expenses/ExpensePlansListTable';
import { buildExpensePlanIntegratedFilterConfigs } from '@/features/finance/components/expenses/build-expense-plan-integrated-filter-configs';
import { ExpensePlansPageSettingsSheet } from '@/features/finance/components/expenses/ExpensePlansPageSettingsSheet';
import { buildExpensePlansViewOptions } from '@/features/finance/components/expenses/expense-plans-view-options';
import {
  translateExpensePlanCategory,
  useExpensePlansT,
} from '@/features/finance/components/expenses/expense-plan-message-keys';
import { ExpensePlanDetailSheet } from '@/features/finance/components/expenses/ExpensePlanDetailSheet';
import { ExpenseDetailSheet } from '@/features/finance/components/expenses/ExpenseDetailSheet';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { OPEN_EXPENSE_QUERY } from '@/features/finance/constants/expense-deep-link';
import {
  expensePlansListWithOpenExpenseHref,
  OPEN_EXPENSE_PLAN_QUERY,
} from '@/features/finance/constants/expense-plan-deep-link';
import { useExpensePlansCsvExport } from '@/features/finance/components/expenses/use-expense-plans-csv-export';
import { PROJECTS_PAGE_SIZE } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { useMobilePreferredView } from '@/hooks/use-mobile-preferred-view';
import {
  buildExpensePlanListApiParams,
  buildExpensePlanListExportParams,
  expensePlanListHasActiveFilters,
  parseExpensePlansListCategoryParam,
  parseExpensePlansListProjectIdParam,
  parseExpensePlansListSearchParam,
  parseExpensePlansListStatusParam,
} from '@/features/finance/utils/build-expense-plan-list-api-params';
import {
  expensePlansApi,
  type ExpensePlan,
  type ExpensePlanGridPayload,
} from '@/lib/api/expense-plans';
import { projectsApi, type Project } from '@/lib/api/projects';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';
import { SEARCH_FILTER_PAGE_ID, usePersistedSearchFilters } from '@/lib/persisted-client-state';

const EXPENSE_PLANS_SEARCH_DEBOUNCE_MS = 450;
const DEFAULT_GRID_YEAR = new Date().getFullYear();

function parseGridYearParam(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_GRID_YEAR;
}

export function ExpensePlansPageContent() {
  const t = useExpensePlansT();
  useFinanceDocumentTitle(t('page.title'));

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = parseExpensePlansListSearchParam(
    searchParams.get(EXPENSE_PLANS_LIST_SEARCH_QUERY),
  );
  const [planFilters, setPlanFilters] = usePersistedSearchFilters(
    SEARCH_FILTER_PAGE_ID.financeExpensePlans,
  );
  const category = parseExpensePlansListCategoryParam(
    searchParams.get(EXPENSE_PLANS_LIST_CATEGORY_QUERY) ?? planFilters.category ?? null,
  );
  const projectId = parseExpensePlansListProjectIdParam(
    searchParams.get(EXPENSE_PLANS_LIST_PROJECT_QUERY) ?? planFilters.project ?? null,
  );
  const status = parseExpensePlansListStatusParam(
    searchParams.get(EXPENSE_PLANS_LIST_STATUS_QUERY) ?? planFilters.status ?? null,
  );
  const gridYear = parseGridYearParam(searchParams.get(EXPENSE_PLANS_LIST_YEAR_QUERY));

  const [view, setView] = useExpensePlansViewMode();
  const displayView = useMobilePreferredView(view, 'grid');
  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const debouncedSearchDraft = useDebouncedValue(searchDraft, EXPENSE_PLANS_SEARCH_DEBOUNCE_MS);
  const [plans, setPlans] = useState<ExpensePlan[]>([]);
  const [gridPayload, setGridPayload] = useState<ExpensePlanGridPayload | null>(null);
  const [totalInScope, setTotalInScope] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridError, setGridError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePlan, setGeneratePlan] = useState<ExpensePlan | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [, setProjectsLoading] = useState(false);
  const plansRef = useRef(plans);
  const gridPayloadRef = useRef(gridPayload);

  const replaceListUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleViewChange = useCallback(
    (next: ExpensePlansViewMode) => {
      setView(next);
    },
    [setView],
  );

  const handleGridYearChange = useCallback(
    (year: number) => {
      replaceListUrl((next) => {
        next.set(EXPENSE_PLANS_LIST_YEAR_QUERY, String(year));
      });
    },
    [replaceListUrl],
  );

  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const trimmedDraft = debouncedSearchDraft.trim();
    if (trimmedDraft === urlSearch) return;
    replaceListUrl((next) => {
      if (!trimmedDraft) {
        next.delete(EXPENSE_PLANS_LIST_SEARCH_QUERY);
      } else {
        next.set(EXPENSE_PLANS_LIST_SEARCH_QUERY, trimmedDraft);
      }
    });
  }, [debouncedSearchDraft, urlSearch, replaceListUrl]);

  const listParams = useMemo(
    () =>
      buildExpensePlanListApiParams({
        search: urlSearch,
        category,
        projectId,
        status,
        page: 1,
        pageSize: 100,
      }),
    [urlSearch, category, projectId, status],
  );

  const gridParams = useMemo(
    () => ({
      year: gridYear,
      search: urlSearch || undefined,
      category: category || undefined,
      projectId: projectId || undefined,
      status: listParams.status,
    }),
    [gridYear, urlSearch, category, projectId, status],
  );

  const exportParams = useMemo(
    () =>
      buildExpensePlanListExportParams({
        search: urlSearch,
        category,
        projectId,
        status,
      }),
    [urlSearch, category, projectId, status],
  );

  const hasActiveFilters = expensePlanListHasActiveFilters({
    search: urlSearch,
    category,
    projectId,
    status,
  });

  const { exportCsvSubmitting, handleExportCsv } = useExpensePlansCsvExport(exportParams);

  useEffect(() => {
    plansRef.current = plans;
  }, [plans]);

  useEffect(() => {
    gridPayloadRef.current = gridPayload;
  }, [gridPayload]);

  const fetchPlans = useCallback(async () => {
    if (plansRef.current.length === 0) setLoading(true);
    try {
      const res = await expensePlansApi.getAll(listParams);
      setPlans(res.items);
      setTotalInScope(res.meta.total);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(caught, t('errors.loadList')),
      );
    } finally {
      setLoading(false);
    }
  }, [listParams, t]);

  const fetchGrid = useCallback(async () => {
    if (!gridPayloadRef.current) setGridLoading(true);
    try {
      const payload = await expensePlansApi.getGrid(gridParams);
      setGridPayload(payload);
      setGridError(null);
    } catch (caught) {
      setGridError(
        getApiErrorMessage(caught, t('errors.loadGrid')),
      );
    } finally {
      setGridLoading(false);
    }
  }, [gridParams, t]);

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    void fetchGrid();
  }, [fetchGrid]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPlans(), fetchGrid()]);
  }, [fetchPlans, fetchGrid]);

  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    projectsApi
      .getAll({ page: 1, pageSize: PROJECTS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setProjects(res.items);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRunAutoGenerateDue = useCallback(async () => {
    setAutoRunning(true);
    try {
      const res = await expensePlansApi.runAutoGenerateDue();
      const failNote =
        res.failures.length > 0
          ? t('toasts.autoGenerateFailures', { count: res.failures.length })
          : '';
      toast.success(
        `${t('toasts.autoGenerateDone', {
          eligibleCount: res.eligibleCount,
          createdCount: res.created.length,
        })}${failNote}`,
      );
      await refreshAll();
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          t('errors.autoGenerate'),
        ),
      );
    } finally {
      setAutoRunning(false);
    }
  }, [refreshAll, t]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      setPlanFilters((prev) => ({ ...prev, category: value }));
      replaceListUrl((next) => {
        if (!value) {
          next.delete(EXPENSE_PLANS_LIST_CATEGORY_QUERY);
        } else {
          next.set(EXPENSE_PLANS_LIST_CATEGORY_QUERY, value);
        }
      });
    },
    [replaceListUrl, setPlanFilters],
  );

  const handleProjectIdChange = useCallback(
    (value: string) => {
      setPlanFilters((prev) => ({ ...prev, project: value }));
      replaceListUrl((next) => {
        if (!value) {
          next.delete(EXPENSE_PLANS_LIST_PROJECT_QUERY);
        } else {
          next.set(EXPENSE_PLANS_LIST_PROJECT_QUERY, value);
        }
      });
    },
    [replaceListUrl, setPlanFilters],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      const nextStatus = value || EXPENSE_PLAN_STATUS_FILTER_ACTIVE;
      setPlanFilters((prev) => ({ ...prev, status: nextStatus }));
      replaceListUrl((next) => {
        if (!nextStatus || nextStatus === EXPENSE_PLAN_STATUS_FILTER_ACTIVE) {
          next.delete(EXPENSE_PLANS_LIST_STATUS_QUERY);
        } else {
          next.set(EXPENSE_PLANS_LIST_STATUS_QUERY, nextStatus);
        }
      });
    },
    [replaceListUrl, setPlanFilters],
  );

  const planFilterConfigs = useMemo(
    () =>
      buildExpensePlanIntegratedFilterConfigs(projects, {
        status: t('filters.status'),
        active: t('status.ACTIVE'),
        cancelled: t('status.CANCELLED'),
        all: t('filters.allStatuses'),
        category: t('filters.category'),
        project: t('filters.project'),
        categoryLabel: (value, fallback) => translateExpensePlanCategory(t, value, fallback),
      }),
    [projects, t],
  );

  const planFilterValues = useMemo(
    () => ({
      status,
      category: category ?? 'all',
      project: projectId ?? 'all',
    }),
    [category, projectId, status],
  );

  const handlePlanFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === 'status') {
        handleStatusChange(value);
        return;
      }
      if (key === 'category') {
        handleCategoryChange(value === 'all' ? '' : value);
        return;
      }
      if (key === 'project') {
        handleProjectIdChange(value === 'all' ? '' : value);
      }
    },
    [handleCategoryChange, handleProjectIdChange, handleStatusChange],
  );

  const handleClearFilters = useCallback(() => {
    setSearchDraft('');
    setPlanFilters({});
    replaceListUrl((next) => {
      next.delete(EXPENSE_PLANS_LIST_SEARCH_QUERY);
      next.delete(EXPENSE_PLANS_LIST_CATEGORY_QUERY);
      next.delete(EXPENSE_PLANS_LIST_PROJECT_QUERY);
      next.delete(EXPENSE_PLANS_LIST_STATUS_QUERY);
    });
  }, [replaceListUrl, setPlanFilters]);

  const showListPanel = displayView === 'list';
  const showGridPanel = displayView === 'grid';
  const showBoardPanel = displayView === 'board';

  const openPlanIdFromUrl = searchParams.get(OPEN_EXPENSE_PLAN_QUERY)?.trim() || null;
  const openExpenseIdFromUrl = searchParams.get(OPEN_EXPENSE_QUERY)?.trim() || null;
  const planSheetOpen = Boolean(openPlanIdFromUrl);
  const expenseSheetOpen = Boolean(openExpenseIdFromUrl);
  const initialPlan = useMemo(
    () => plans.find((plan) => plan.id === openPlanIdFromUrl) ?? null,
    [openPlanIdFromUrl, plans],
  );

  const openExpensePlanDetailById = useCallback(
    (planId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_EXPENSE_PLAN_QUERY, planId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const openExpensePlanDetail = useCallback(
    (plan: ExpensePlan) => {
      openExpensePlanDetailById(plan.id);
    },
    [openExpensePlanDetailById],
  );

  const openExpenseDetail = useCallback(
    (expenseId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_EXPENSE_QUERY, expenseId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handlePlanSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has(OPEN_EXPENSE_PLAN_QUERY)) return;
      params.delete(OPEN_EXPENSE_PLAN_QUERY);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleExpenseSheetOpenChange = useCallback(
    (next: boolean) => {
      if (next) return;
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has(OPEN_EXPENSE_QUERY)) return;
      params.delete(OPEN_EXPENSE_QUERY);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder={t('page.searchPlaceholder')}
          filters={planFilterConfigs}
          filterValues={planFilterValues}
          onFilterChange={handlePlanFilterChange}
          onClearAll={handleClearFilters}
        />
      ),
      viewMode: (
        <ViewModeSwitch
          value={view}
          onChange={handleViewChange}
          options={buildExpensePlansViewOptions(t)}
          ariaLabel={t('page.viewAria')}
        />
      ),
      trailing: (
        <>
          <ExpensePlansPageSettingsSheet
            exportDisabled={loading || exportCsvSubmitting}
            exportInProgress={exportCsvSubmitting}
            autoGenerateDisabled={loading || autoRunning}
            autoGenerateInProgress={autoRunning}
            onExportCsv={handleExportCsv}
            onRunAutoGenerateDue={handleRunAutoGenerateDue}
          />
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            {t('page.newPlan')}
          </Button>
        </>
      ),
    }),
    [
      autoRunning,
      exportCsvSubmitting,
      handleClearFilters,
      handleExportCsv,
      handlePlanFilterChange,
      handleRunAutoGenerateDue,
      handleViewChange,
      loading,
      planFilterConfigs,
      planFilterValues,
      searchDraft,
      t,
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {showGridPanel ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ExpensePlanCoverageGrid
            year={gridYear}
            onYearChange={handleGridYearChange}
            payload={gridPayload}
            loading={gridLoading}
            error={gridError}
            onRetry={() => void fetchGrid()}
            onOpenPlan={openExpensePlanDetailById}
            onOpenExpense={openExpenseDetail}
          />
        </div>
      ) : null}

      {showBoardPanel || showListPanel ? (
        loading ? (
          <LoadingState count={3} />
        ) : error ? (
          <ErrorState description={error} onRetry={() => void fetchPlans()} />
        ) : plans.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={
              totalInScope === 0 && !hasActiveFilters ? t('empty.title') : t('empty.filteredTitle')
            }
            description={
              totalInScope === 0 && !hasActiveFilters
                ? t('empty.description')
                : t('empty.filteredDescription')
            }
            action={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={handleClearFilters}>
                  {t('page.clearFilters')}
                </Button>
              ) : undefined
            }
          />
        ) : showBoardPanel ? (
          <ExpensePlansBoard plans={plans} onOpen={openExpensePlanDetail} />
        ) : (
          <ExpensePlansListTable plans={plans} onOpen={openExpensePlanDetail} />
        )
      ) : null}

      <CreateExpensePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void refreshAll();
        }}
      />

      <GenerateExpenseCardFromPlanDialog
        plan={generatePlan}
        open={generateOpen}
        onOpenChange={(next) => {
          setGenerateOpen(next);
          if (!next) setGeneratePlan(null);
        }}
        onGenerated={() => void refreshAll()}
      />

      <ExpensePlanDetailSheet
        planId={openPlanIdFromUrl}
        initialPlan={initialPlan}
        open={planSheetOpen}
        onOpenChange={handlePlanSheetOpenChange}
        onPlanUpdated={() => void refreshAll()}
        onPlanDeleted={() => void refreshAll()}
      />

      <ExpenseDetailSheet
        expenseId={openExpenseIdFromUrl}
        open={expenseSheetOpen}
        onOpenChange={handleExpenseSheetOpenChange}
        onExpenseUpdated={() => void refreshAll()}
        onExpenseDeleted={() => void refreshAll()}
        sourcePageHref={
          openExpenseIdFromUrl
            ? expensePlansListWithOpenExpenseHref(openExpenseIdFromUrl, openPlanIdFromUrl)
            : undefined
        }
        forceNestedBackdrop={planSheetOpen}
        listHrefOptions={{ expensePlanId: openPlanIdFromUrl }}
      />
    </div>
  );
}

export function ExpensePlansPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingState count={3} />}>
      <ExpensePlansPageContent />
    </Suspense>
  );
}
