'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FilterBar } from '@/components/shared';
import { type FinancePeriod } from '@/features/finance/constants/finance';
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
import { ExpensesPageDialogs } from './ExpensesPageDialogs';
import { ExpenseProjectDrilldownBanner } from './ExpenseProjectDrilldownBanner';
import { buildExpenseFilterConfigs } from './expenses-filter-config';
import { ExpensesPageMainPanel, type ExpensesViewMode } from './ExpensesPageMainPanel';
import { useExpenseProjectFilterOptions } from './use-expense-project-filter-options';
import {
  buildExpenseListApiParams,
  EXPENSE_LIST_UI_PAGE_SIZE,
} from '@/features/finance/utils/build-expense-list-api-params';
import { useExpenseCsvExport } from './use-expense-csv-export';

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
  const [view, setView] = useState<ExpensesViewMode>('list');
  const [period, setPeriod] = useState<FinancePeriod>('month');
  const [projectBanner, setProjectBanner] = useState<{ id: string; text: string } | null>(null);
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
    if (!projectIdFromUrl) return;
    let cancelled = false;
    projectsApi
      .getById(projectIdFromUrl)
      .then((p) => {
        if (!cancelled) {
          setProjectBanner({ id: projectIdFromUrl, text: `${p.code} · ${p.name}` });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjectBanner({ id: projectIdFromUrl, text: '' });
        }
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

  const listApiParams = useMemo(
    () =>
      buildExpenseListApiParams({
        search,
        filters,
        period,
        effectiveProjectId,
        sortBy,
        sortOrder,
      }),
    [search, filters, period, effectiveProjectId, sortBy, sortOrder],
  );

  const { exportCsvSubmitting, handleExportCsv } = useExpenseCsvExport(listApiParams);

  const projectBannerLabel =
    projectIdFromUrl && projectBanner?.id === projectIdFromUrl ? projectBanner.text || null : null;

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
      const [data, expenseStats] = await Promise.all([
        expensesApi.getAll({
          ...listApiParams,
          pageSize: EXPENSE_LIST_UI_PAGE_SIZE,
        }),
        expensesApi.getStats({
          dateFrom: listApiParams.dateFrom,
          dateTo: listApiParams.dateTo,
          projectId: listApiParams.projectId,
        }),
      ]);
      setExpenses(data.items);
      setStats(expenseStats);
      setError(null);
    } catch {
      setError('Expenses could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [listApiParams]);

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
        exportDisabled={loading || exportCsvSubmitting}
        exportInProgress={exportCsvSubmitting}
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

      <ExpensesPageMainPanel
        loading={loading}
        error={error}
        onRetry={fetchExpenses}
        expenses={expenses}
        view={view}
        effectiveProjectId={effectiveProjectId ?? null}
        listSort={{ sortBy, sortOrder }}
        onRequestDelete={(row) => {
          setDeleteError(null);
          setDeleteTarget(row);
        }}
        onAddFirstExpense={() => setCreateOpen(true)}
      />

      <ExpensesPageDialogs
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        effectiveProjectId={effectiveProjectId ?? null}
        onExpenseCreated={(created) => {
          fetchExpenses();
          router.push(
            expenseDetailHref(created.id, effectiveProjectId ?? null, { sortBy, sortOrder }),
          );
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
