'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCcw, Receipt, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHeader,
  FilterBar,
  EmptyState,
  ErrorState,
  LoadingState,
  KanbanBoard,
} from '@/components/shared';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STAGES,
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
  type FinancePeriod,
  formatAmount,
} from '@/features/finance/constants/finance';
import { expensesApi, type Expense, type ExpenseStats } from '@/lib/api/finance';
import { projectsApi } from '@/lib/api/projects';
import { expenseDetailHref } from '@/features/finance/constants/project-expenses-drilldown';
import { CreateExpenseDialog } from './CreateExpenseDialog';
import { DeleteExpenseDialog } from './DeleteExpenseDialog';
import { ExpenseKanbanCard } from './ExpenseKanbanCard';
import { ExpenseProjectDrilldownBanner } from './ExpenseProjectDrilldownBanner';
import { ExpensesTableSection } from './ExpensesTableSection';

type ViewMode = 'kanban' | 'list';

interface ExpensesPageContentProps {
  projectIdFromUrl: string | null;
  onClearProjectFilter: () => void;
}

export function ExpensesPageContent({
  projectIdFromUrl,
  onClearProjectFilter,
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

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const projectParams = projectIdFromUrl !== null ? { projectId: projectIdFromUrl } : {};
      const [data, expenseStats] = await Promise.all([
        expensesApi.getAll({
          pageSize: 100,
          search: search || undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
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
  }, [search, filters, period, projectIdFromUrl]);

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

  const filterConfigs = [
    {
      key: 'category',
      label: 'Category',
      options: EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      key: 'status',
      label: 'Status',
      options: EXPENSE_STAGES.map((s) => ({ value: s.value, label: s.label })),
    },
  ];

  const STAGE_COLORS: Record<string, string> = {
    THIS_MONTH: 'bg-blue-500',
    PAY_NOW: 'bg-orange-500',
    DELAYED: 'bg-amber-500',
    ON_HOLD: 'bg-gray-400',
    PAID: 'bg-green-500',
  };

  const kanbanColumns = EXPENSE_STAGES.filter((s) =>
    ['THIS_MONTH', 'PAY_NOW', 'DELAYED', 'ON_HOLD', 'PAID'].includes(s.value),
  ).map((stage) => ({
    key: stage.value,
    label: stage.label,
    color: STAGE_COLORS[stage.value] ?? 'bg-gray-400',
    items: expenses.filter((e) => e.status === stage.value),
  }));

  return (
    <div className="flex h-full flex-col gap-5">
      <PageHeader title="Expenses" description={`${expenses.length} total`}>
        <div className="border-border flex rounded-lg border p-1">
          {FINANCE_PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchExpenses}>
          <RefreshCcw size={16} />
        </Button>
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('list')}
            className="rounded-r-none"
          >
            <List size={14} />
          </Button>
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setView('kanban')}
            className="rounded-l-none"
          >
            <LayoutGrid size={14} />
          </Button>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New Expense
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Total Expenses</p>
          <p className="mt-1 text-xl font-bold">{formatAmount(totalExpenses)}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <p className="text-muted-foreground text-xs">Paid</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatAmount(paidExpenses)}</p>
        </div>
      </div>

      {projectIdFromUrl ? (
        <ExpenseProjectDrilldownBanner
          projectId={projectIdFromUrl}
          projectBannerLabel={projectBannerLabel}
          onClearProjectFilter={onClearProjectFilter}
        />
      ) : null}

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search expenses..."
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onClearFilters={() => setFilters({})}
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
              listProjectId={projectIdFromUrl}
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
          listProjectId={projectIdFromUrl}
          onRequestDelete={(row) => {
            setDeleteError(null);
            setDeleteTarget(row);
          }}
        />
      )}

      <CreateExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectId={projectIdFromUrl}
        onCreated={(created) => {
          fetchExpenses();
          router.push(expenseDetailHref(created.id, projectIdFromUrl));
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
