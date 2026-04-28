'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterBar, EmptyState, ErrorState, LoadingState, KanbanBoard } from '@/components/shared';
import { getFinancePeriodParams, type FinancePeriod } from '@/features/finance/constants/finance';
import {
  expensesApi,
  type Expense,
  type ExpenseListSortField,
  type ExpenseStats,
} from '@/lib/api/finance';
import { projectsApi } from '@/lib/api/projects';
import {
  PROJECT_EXPENSES_DRILLDOWN_QUERY,
  expenseDetailHref,
} from '@/features/finance/constants/project-expenses-drilldown';
import { ExpenseSortControls } from './ExpenseSortControls';
import { ExpensesPageHeader } from './ExpensesPageHeader';
import { ExpenseSummaryCards } from './ExpenseSummaryCards';
import { CreateExpenseDialog } from './CreateExpenseDialog';
import { DeleteExpenseDialog } from './DeleteExpenseDialog';
import { ExpenseKanbanCard } from './ExpenseKanbanCard';
import { ExpenseProjectDrilldownBanner } from './ExpenseProjectDrilldownBanner';
import { buildExpenseKanbanColumns } from './expense-kanban-columns';
import { buildExpenseFilterConfigs } from './expenses-filter-config';
import { ExpensesTableSection } from './ExpensesTableSection';
import { useExpenseProjectFilterOptions } from './use-expense-project-filter-options';
import { downloadExpensesCsv } from '@/features/finance/utils/export-expenses-csv';

type ViewMode = 'kanban' | 'list';

interface ExpensesPageContentProps {
  projectIdFromUrl: string | null;
  onClearProjectFilter: () => void;
  replaceExpensesUrl: (mutate: (params: URLSearchParams) => void) => void;
  sortBy: ExpenseListSortField;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: ExpenseListSortField) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

export function ExpensesPageContent({
  projectIdFromUrl,
  onClearProjectFilter,
  replaceExpensesUrl,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: ExpensesPageContentProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('list');
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [projectBannerLabel, setProjectBannerLabel] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const projectFilterOptions = useExpenseProjectFilterOptions();

  useEffect(() => {
    if (projectIdFromUrl) {
      setFilters((prev) => ({ ...prev, project: projectIdFromUrl }));
    }
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (!projectIdFromUrl) {
      setProjectBannerLabel(null);
      return;
    }
    let cancelled = false;
    projectsApi
      .getById(projectIdFromUrl)
      .then((p) => {
        if (!cancelled) setProjectBannerLabel(`${p.code} · ${p.name}`);
      })
      .catch(() => {
        if (!cancelled) setProjectBannerLabel(null);
      });
    return () => {
      cancelled = true;
    };
  }, [projectIdFromUrl]);

  const effectiveProjectId = useMemo(() => {
    if (projectIdFromUrl) return projectIdFromUrl;
    const fp = filters.project;
    return fp && fp !== 'all' ? fp : undefined;
  }, [projectIdFromUrl, filters.project]);

  const handleClearProjectDrilldown = useCallback(() => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next.project;
      return next;
    });
    onClearProjectFilter();
  }, [onClearProjectFilter]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      if (projectIdFromUrl && key === 'project') {
        replaceExpensesUrl((params) => {
          params.delete(PROJECT_EXPENSES_DRILLDOWN_QUERY);
        });
      }
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [projectIdFromUrl, replaceExpensesUrl],
  );

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const projectParams =
        effectiveProjectId !== undefined ? { projectId: effectiveProjectId } : {};
      const [data, expenseStats] = await Promise.all([
        expensesApi.getAll({
          pageSize: 100,
          search: search || undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          sortBy,
          sortOrder,
          ...periodParams,
          ...projectParams,
        }),
        expensesApi.getStats({ ...periodParams, ...projectParams }),
      ]);
      setExpenses(data.items);
      setStats(expenseStats);
      setError(null);
    } catch {
      setError('Expenses could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters.category, filters.status, period, effectiveProjectId, sortBy, sortOrder]);

  const handleConfirmDeleteExpense = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await expensesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      await fetchExpenses();
    } catch {
      setDeleteError('Expense could not be deleted. Check your connection and try again.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalExpenses = Number(stats?.totalAmount ?? 0);
  const paidExpenses = Number(stats?.paidAmount ?? 0);

  const filterConfigs = useMemo(
    () => buildExpenseFilterConfigs(projectFilterOptions),
    [projectFilterOptions],
  );

  const kanbanColumns = buildExpenseKanbanColumns(expenses);

  const handleExportCsv = useCallback(() => {
    downloadExpensesCsv(expenses);
  }, [expenses]);

  return (
    <div className="flex h-full flex-col gap-5">
      <ExpensesPageHeader
        expenseCount={expenses.length}
        period={period}
        onPeriodChange={setPeriod}
        view={view}
        onViewChange={setView}
        onRefresh={fetchExpenses}
        onExportCsv={handleExportCsv}
        exportDisabled={loading || expenses.length === 0}
        onCreateClick={() => setCreateOpen(true)}
      />

      <ExpenseSummaryCards totalExpenses={totalExpenses} paidExpenses={paidExpenses} />

      {projectIdFromUrl ? (
        <ExpenseProjectDrilldownBanner
          projectId={projectIdFromUrl}
          projectBannerLabel={projectBannerLabel}
          onClearProjectFilter={handleClearProjectDrilldown}
        />
      ) : null}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expenses..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters({})}
        actions={
          <ExpenseSortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={onSortByChange}
            onSortOrderChange={onSortOrderChange}
          />
        }
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchExpenses} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Track company expenses here"
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Add First Expense
            </Button>
          }
        />
      ) : view === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          getItemId={(e: Expense) => e.id}
          renderCard={(expense: Expense) => (
            <ExpenseKanbanCard
              expense={expense}
              listProjectId={effectiveProjectId ?? null}
              listSort={{ sortBy, sortOrder }}
              onRequestDelete={(row) => {
                setDeleteError(null);
                setDeleteTarget(row);
              }}
            />
          )}
        />
      ) : (
        <ExpensesTableSection
          expenses={expenses}
          listProjectId={effectiveProjectId ?? null}
          listSort={{ sortBy, sortOrder }}
          onRequestDelete={(row) => {
            setDeleteError(null);
            setDeleteTarget(row);
          }}
        />
      )}

      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectId={effectiveProjectId ?? null}
        onCreated={(created) => {
          fetchExpenses();
          router.push(
            expenseDetailHref(created.id, effectiveProjectId ?? null, { sortBy, sortOrder }),
          );
        }}
      />

      <DeleteExpenseDialog
        expenseName={deleteTarget?.name ?? ''}
        open={deleteTarget !== null}
        isSubmitting={deleteSubmitting}
        errorMessage={deleteError}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        onConfirm={handleConfirmDeleteExpense}
      />
    </div>
  );
}
