'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  RefreshCcw,
  Receipt,
  DollarSign,
  FolderKanban,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  PageHeader,
  FilterBar,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  KanbanBoard,
} from '@/components/shared';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STAGES,
  FINANCE_PERIOD_OPTIONS,
  getFinancePeriodParams,
  type FinancePeriod,
  getExpenseStage,
  formatAmount,
} from '@/features/finance/constants/finance';
import { expensesApi, type Expense, type ExpenseStats } from '@/lib/api/finance';

type ViewMode = 'kanban' | 'list';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewMode>('list');
  const [period, setPeriod] = useState<FinancePeriod>('month');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const periodParams = getFinancePeriodParams(period);
      const [data, expenseStats] = await Promise.all([
        expensesApi.getAll({
          pageSize: 100,
          search: search || undefined,
          category: filters.category && filters.category !== 'all' ? filters.category : undefined,
          status: filters.status && filters.status !== 'all' ? filters.status : undefined,
          ...periodParams,
        }),
        expensesApi.getStats(periodParams),
      ]);
      setExpenses(data.items);
      setStats(expenseStats);
      setError(null);
    } catch {
      setError('Expenses could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filters, period]);

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
        <Button>
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
            <Button>
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
            <div className="border-border bg-card cursor-pointer space-y-2 rounded-xl border p-3 transition-shadow hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{expense.category}</span>
                <StatusBadge
                  label={expense.type}
                  variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
                />
              </div>
              <p className="text-sm font-medium">{expense.name}</p>
              <p className="text-sm font-bold">{formatAmount(parseFloat(expense.amount))}</p>
              {expense.project && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <FolderKanban size={10} />
                  {expense.project.name}
                </div>
              )}
            </div>
          )}
        />
      ) : (
        <div className="border-border overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const stage = getExpenseStage(expense.status);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <p className="font-medium">{expense.name}</p>
                      {expense.notes && (
                        <p className="text-muted-foreground max-w-[200px] truncate text-xs">
                          {expense.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{expense.category}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={expense.type}
                        variant={expense.type === 'PLANNED' ? 'blue' : 'orange'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="flex items-center justify-end gap-1 font-semibold">
                        <DollarSign size={12} className="text-accent" />
                        {formatAmount(parseFloat(expense.amount))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {stage && <StatusBadge label={stage.label} variant={stage.variant} />}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {expense.project?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
