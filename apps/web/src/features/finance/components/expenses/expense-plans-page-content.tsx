'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
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
  EXPENSE_PLANS_LIST_YEAR_QUERY,
} from '@/features/finance/constants/expense-plans-list-url';
import {
  useExpensePlansViewMode,
  type ExpensePlansViewMode,
} from '@/features/finance/constants/expense-plans-view';
import { expensePlansListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { CreateExpensePlanDialog } from '@/features/finance/components/expenses/CreateExpensePlanDialog';
import { ExpensePlanCoverageGrid } from '@/features/finance/components/expenses/ExpensePlanCoverageGrid';
import { ExpensePlansBoard } from '@/features/finance/components/expenses/ExpensePlansBoard';
import { ExpensePlansListTable } from '@/features/finance/components/expenses/ExpensePlansListTable';
import { buildExpensePlanIntegratedFilterConfigs } from '@/features/finance/components/expenses/build-expense-plan-integrated-filter-configs';
import { ExpensePlansPageSettingsSheet } from '@/features/finance/components/expenses/ExpensePlansPageSettingsSheet';
import { EXPENSE_PLANS_VIEW_OPTIONS } from '@/features/finance/components/expenses/expense-plans-view-options';
import { ExpensePlanDetailSheet } from '@/features/finance/components/expenses/ExpensePlanDetailSheet';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { OPEN_EXPENSE_PLAN_QUERY } from '@/features/finance/constants/expense-plan-deep-link';
import { useExpensePlansCsvExport } from '@/features/finance/components/expenses/use-expense-plans-csv-export';
import { PROJECTS_PAGE_SIZE } from '@/features/finance/components/expenses/edit-expense-dialog-constants';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import {
  buildExpensePlanListApiParams,
  buildExpensePlanListExportParams,
  expensePlanListHasActiveFilters,
  parseExpensePlansListCategoryParam,
  parseExpensePlansListProjectIdParam,
  parseExpensePlansListSearchParam,
} from '@/features/finance/utils/build-expense-plan-list-api-params';
import {
  expensePlansApi,
  type ExpensePlan,
  type ExpensePlanGridPayload,
} from '@/lib/api/expense-plans';
import { projectsApi, type Project } from '@/lib/api/projects';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

const EXPENSE_PLANS_SEARCH_DEBOUNCE_MS = 450;
const DEFAULT_GRID_YEAR = new Date().getFullYear();

function parseGridYearParam(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : DEFAULT_GRID_YEAR;
}

export function ExpensePlansPageContent() {
  useFinanceDocumentTitle(expensePlansListPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlSearch = parseExpensePlansListSearchParam(
    searchParams.get(EXPENSE_PLANS_LIST_SEARCH_QUERY),
  );
  const category = parseExpensePlansListCategoryParam(
    searchParams.get(EXPENSE_PLANS_LIST_CATEGORY_QUERY),
  );
  const projectId = parseExpensePlansListProjectIdParam(
    searchParams.get(EXPENSE_PLANS_LIST_PROJECT_QUERY),
  );
  const gridYear = parseGridYearParam(searchParams.get(EXPENSE_PLANS_LIST_YEAR_QUERY));

  const [view, setView] = useExpensePlansViewMode();
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

  const replaceListUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
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
        page: 1,
        pageSize: 100,
      }),
    [urlSearch, category, projectId],
  );

  const gridParams = useMemo(
    () => ({
      year: gridYear,
      search: urlSearch || undefined,
      category: category || undefined,
      projectId: projectId || undefined,
    }),
    [gridYear, urlSearch, category, projectId],
  );

  const exportParams = useMemo(
    () =>
      buildExpensePlanListExportParams({
        search: urlSearch,
        category,
        projectId,
      }),
    [urlSearch, category, projectId],
  );

  const hasActiveFilters = expensePlanListHasActiveFilters({
    search: urlSearch,
    category,
    projectId,
  });

  const { exportCsvSubmitting, handleExportCsv } = useExpensePlansCsvExport(exportParams);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expensePlansApi.getAll(listParams);
      setPlans(res.items);
      setTotalInScope(res.meta.total);
      setError(null);
    } catch (caught) {
      setError(
        getApiErrorMessage(caught, 'Expense plans could not be loaded. Check your connection.'),
      );
    } finally {
      setLoading(false);
    }
  }, [listParams]);

  const fetchGrid = useCallback(async () => {
    setGridLoading(true);
    try {
      const payload = await expensePlansApi.getGrid(gridParams);
      setGridPayload(payload);
      setGridError(null);
    } catch (caught) {
      setGridError(
        getApiErrorMessage(caught, 'Plan calendar could not be loaded. Check your connection.'),
      );
    } finally {
      setGridLoading(false);
    }
  }, [gridParams]);

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
        res.failures.length > 0 ? ` Failures: ${res.failures.length} (see server logs).` : '';
      toast.success(
        `Processed ${res.eligibleCount} due plan(s): ${res.created.length} card(s) created.${failNote}`,
      );
      await refreshAll();
    } catch (caught) {
      toast.error(
        getApiErrorMessage(
          caught,
          'Auto-generate for due plans failed. Check your connection and try again.',
        ),
      );
    } finally {
      setAutoRunning(false);
    }
  }, [refreshAll]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      replaceListUrl((next) => {
        if (!value) {
          next.delete(EXPENSE_PLANS_LIST_CATEGORY_QUERY);
        } else {
          next.set(EXPENSE_PLANS_LIST_CATEGORY_QUERY, value);
        }
      });
    },
    [replaceListUrl],
  );

  const handleProjectIdChange = useCallback(
    (value: string) => {
      replaceListUrl((next) => {
        if (!value) {
          next.delete(EXPENSE_PLANS_LIST_PROJECT_QUERY);
        } else {
          next.set(EXPENSE_PLANS_LIST_PROJECT_QUERY, value);
        }
      });
    },
    [replaceListUrl],
  );

  const planFilterConfigs = useMemo(
    () => buildExpensePlanIntegratedFilterConfigs(projects),
    [projects],
  );

  const planFilterValues = useMemo(
    () => ({
      category: category ?? 'all',
      project: projectId ?? 'all',
    }),
    [category, projectId],
  );

  const handlePlanFilterChange = useCallback(
    (key: string, value: string) => {
      if (key === 'category') {
        handleCategoryChange(value === 'all' ? '' : value);
        return;
      }
      if (key === 'project') {
        handleProjectIdChange(value === 'all' ? '' : value);
      }
    },
    [handleCategoryChange, handleProjectIdChange],
  );

  const handleClearFilters = useCallback(() => {
    setSearchDraft('');
    replaceListUrl((next) => {
      next.delete(EXPENSE_PLANS_LIST_SEARCH_QUERY);
      next.delete(EXPENSE_PLANS_LIST_CATEGORY_QUERY);
      next.delete(EXPENSE_PLANS_LIST_PROJECT_QUERY);
    });
  }, [replaceListUrl]);

  const showListPanel = view === 'list';
  const showGridPanel = view === 'grid';
  const showBoardPanel = view === 'board';

  const openPlanIdFromUrl = searchParams.get(OPEN_EXPENSE_PLAN_QUERY)?.trim() || null;
  const sheetOpen = Boolean(openPlanIdFromUrl);
  const initialPlan = useMemo(
    () => plans.find((plan) => plan.id === openPlanIdFromUrl) ?? null,
    [openPlanIdFromUrl, plans],
  );

  const openExpensePlanDetail = useCallback(
    (plan: ExpensePlan) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(OPEN_EXPENSE_PLAN_QUERY, plan.id);
      router.push(`${pathname}?${params.toString()}`);
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
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search={searchDraft}
          onSearchChange={setSearchDraft}
          searchPlaceholder="Search by name or provider…"
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
          options={EXPENSE_PLANS_VIEW_OPTIONS}
          ariaLabel="Expense plans view"
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
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1" aria-hidden />
            New plan
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
      view,
    ],
  );

  useModuleHeroSlots(moduleHeroSlots);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {showGridPanel ? (
        <ExpensePlanCoverageGrid
          year={gridYear}
          onYearChange={handleGridYearChange}
          payload={gridPayload}
          loading={gridLoading}
          error={gridError}
          onRetry={() => void fetchGrid()}
          onOpenPlan={(planId) => {
            const plan = plans.find((row) => row.id === planId);
            if (plan) openExpensePlanDetail(plan);
          }}
        />
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
              totalInScope === 0 && !hasActiveFilters ? 'No expense plans yet' : 'No matching plans'
            }
            description={
              totalInScope === 0 && !hasActiveFilters
                ? 'Create a plan for rent, SaaS, or other recurring spend; cards appear on pay now when due.'
                : 'Try clearing filters or switch to the calendar grid.'
            }
            action={
              hasActiveFilters ? (
                <Button type="button" variant="outline" onClick={handleClearFilters}>
                  Clear filters
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
        open={sheetOpen}
        onOpenChange={handlePlanSheetOpenChange}
        onPlanUpdated={() => void refreshAll()}
        onPlanDeleted={() => void refreshAll()}
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
