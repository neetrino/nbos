'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarDays,
  Download,
  FileOutput,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader, EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { formatAmount } from '@/features/finance/constants/finance';
import {
  EXPENSE_PLANS_LIST_CATEGORY_QUERY,
  EXPENSE_PLANS_LIST_PROJECT_QUERY,
  EXPENSE_PLANS_LIST_SEARCH_QUERY,
} from '@/features/finance/constants/expense-plans-list-url';
import { expensePlansListPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import { CreateExpensePlanDialog } from '@/features/finance/components/expenses/CreateExpensePlanDialog';
import { ExpensePlansListToolbar } from '@/features/finance/components/expenses/ExpensePlansListToolbar';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
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
  expensePlanFrequencyLabel,
  formatExpensePlanShortDate,
} from '@/features/finance/utils/expense-plan-display';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';
import { projectsApi, type Project } from '@/lib/api/projects';
import { getApiErrorMessage } from '@/lib/api-errors';
import { toast } from 'sonner';

const SEARCH_DEBOUNCE_MS = 450;

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

  const [searchDraft, setSearchDraft] = useState(urlSearch);
  const [plans, setPlans] = useState<ExpensePlan[]>([]);
  const [totalInScope, setTotalInScope] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePlan, setGeneratePlan] = useState<ExpensePlan | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const replaceListUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchDraft(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (searchDraft === urlSearch) return;
    const tid = window.setTimeout(() => {
      replaceListUrl((next) => {
        if (!searchDraft.trim()) {
          next.delete(EXPENSE_PLANS_LIST_SEARCH_QUERY);
        } else {
          next.set(EXPENSE_PLANS_LIST_SEARCH_QUERY, searchDraft.trim());
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(tid);
  }, [searchDraft, urlSearch, replaceListUrl]);

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

  useEffect(() => {
    void fetchPlans();
  }, [fetchPlans]);

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
      await fetchPlans();
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
  }, [fetchPlans]);

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Delete expense plan “${name}”? Linked cards keep running; plan link is cleared.`,
      )
    ) {
      return;
    }
    try {
      await expensePlansApi.delete(id);
      await fetchPlans();
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Could not delete expense plan.'));
    }
  };

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

  const handleClearFilters = useCallback(() => {
    setSearchDraft('');
    replaceListUrl((next) => {
      next.delete(EXPENSE_PLANS_LIST_SEARCH_QUERY);
      next.delete(EXPENSE_PLANS_LIST_CATEGORY_QUERY);
      next.delete(EXPENSE_PLANS_LIST_PROJECT_QUERY);
    });
  }, [replaceListUrl]);

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader
        title="Expense plans"
        description="Recurring or expected outgoing spend (NBOS Expense Plan). Filter by search, category, or project (URL-synced); CSV export uses the same scope as the list (paged fetch-all, name sort, UTF-8 BOM, grand totals)."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || exportCsvSubmitting}
            onClick={() => void handleExportCsv()}
            title="UTF-8 CSV for the current list filters (same query as the table)"
          >
            {exportCsvSubmitting ? (
              <Loader2 size={16} className="mr-1 animate-spin" aria-hidden />
            ) : (
              <Download size={16} className="mr-1" aria-hidden />
            )}
            Export CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchPlans()}>
            <RefreshCcw size={16} className="mr-1" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || autoRunning}
            onClick={() => void handleRunAutoGenerateDue()}
          >
            {autoRunning ? (
              <Loader2 size={16} className="mr-1 animate-spin" aria-hidden />
            ) : (
              <Wand2 size={16} className="mr-1" aria-hidden />
            )}
            Run auto-generate (due)
          </Button>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={16} className="mr-1" />
            New plan
          </Button>
        </div>
      </PageHeader>

      <ExpensePlansListToolbar
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        category={category}
        onCategoryChange={handleCategoryChange}
        projectId={projectId}
        onProjectIdChange={handleProjectIdChange}
        projects={projects}
        projectsLoading={projectsLoading}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {loading ? (
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
              ? 'Create a plan for rent, SaaS, or other recurring spend; generate Board expenses from a plan when due.'
              : 'Try clearing filters or widening search — CSV export respects the same filters.'
          }
          action={
            hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="border-border rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Auto</TableHead>
                <TableHead>Next due</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Linked cards</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/finance/expenses/plans/${plan.id}`}
                      className="text-primary hover:underline"
                    >
                      {plan.name}
                    </Link>
                  </TableCell>
                  <TableCell>{plan.category}</TableCell>
                  <TableCell>{formatAmount(Number(plan.amount))}</TableCell>
                  <TableCell>{expensePlanFrequencyLabel(plan.frequency)}</TableCell>
                  <TableCell>{plan.autoGenerate ? 'Yes' : '—'}</TableCell>
                  <TableCell>{formatExpensePlanShortDate(plan.nextDueDate)}</TableCell>
                  <TableCell>{plan.project ? `${plan.project.code}` : '—'}</TableCell>
                  <TableCell className="text-right">{plan._count.expenses}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Generate expense from ${plan.name}`}
                        onClick={() => {
                          setGeneratePlan(plan);
                          setGenerateOpen(true);
                        }}
                      >
                        <FileOutput size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${plan.name}`}
                        onClick={() => void handleDelete(plan.id, plan.name)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateExpensePlanDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void fetchPlans();
        }}
      />

      <GenerateExpenseCardFromPlanDialog
        plan={generatePlan}
        open={generateOpen}
        onOpenChange={(next) => {
          setGenerateOpen(next);
          if (!next) setGeneratePlan(null);
        }}
        onGenerated={() => void fetchPlans()}
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
