'use client';

import Link from 'next/link';
import {
  Download,
  Loader2,
  Plus,
  RefreshCcw,
  LayoutGrid,
  List,
  TableProperties,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';
import {
  EXPENSE_BACKLOG_LIST_PATH,
  EXPENSE_CLOSED_LIST_PATH,
  EXPENSE_LIST_PATH,
} from '@/features/finance/constants/project-expenses-drilldown';
import { cn } from '@/lib/utils';

import type { ExpensesViewMode } from './ExpensesPageMainPanel';

interface ExpensesPageHeaderProps {
  expenseCount: number;
  period: FinancePeriod;
  onPeriodChange: (value: FinancePeriod) => void;
  view: ExpensesViewMode;
  onViewChange: (value: ExpensesViewMode) => void;
  /** Backlog route uses list-only layout (see NBOS Finance UI spec). */
  hideViewToggle?: boolean;
  pageVariant?: 'default' | 'backlog' | 'closed';
  onRefresh: () => void;
  /** Fetches all pages matching current list filters and downloads CSV. */
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
  statsExportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
  onCreateClick: () => void;
}

export function ExpensesPageHeader({
  expenseCount,
  period,
  onPeriodChange,
  view,
  onViewChange,
  hideViewToggle = false,
  pageVariant = 'default',
  onRefresh,
  onExportCsv,
  exportDisabled,
  exportInProgress,
  statsExportDisabled,
  onExportScopeStatsCsv,
  onCreateClick,
}: ExpensesPageHeaderProps) {
  const listNav =
    pageVariant === 'backlog' || pageVariant === 'closed' ? (
      <Link
        href={EXPENSE_LIST_PATH}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        Active board
      </Link>
    ) : (
      <div className="flex flex-wrap gap-2">
        <Link
          href={EXPENSE_BACKLOG_LIST_PATH}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Backlog
        </Link>
        <Link
          href={EXPENSE_CLOSED_LIST_PATH}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Closed
        </Link>
      </div>
    );

  const pageTitle =
    pageVariant === 'backlog'
      ? 'Expense backlog'
      : pageVariant === 'closed'
        ? 'Closed expenses'
        : 'Expenses';

  const pageDescription =
    pageVariant === 'backlog'
      ? `${expenseCount} deferred (Delayed)`
      : pageVariant === 'closed'
        ? `${expenseCount} paid`
        : `${expenseCount} active on board`;

  return (
    <PageHeader title={pageTitle} description={pageDescription}>
      {listNav}
      <div className="border-border flex rounded-lg border p-1">
        {FINANCE_PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={period === option.value ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onPeriodChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh expenses">
        <RefreshCcw size={16} />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
        aria-label="Export expense scope statistics as CSV"
        title="UTF-8 CSV snapshot from GET /finance/expenses/stats (period + list-aligned scope fields; search/category/type/sort not applied—see scope_note row)"
      >
        <TableProperties size={16} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={exportDisabled}
        onClick={() => {
          void onExportCsv();
        }}
        aria-label="Export expenses as CSV"
        title="Export all rows matching current filters (paginated fetch)"
      >
        {exportInProgress ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
      </Button>
      {hideViewToggle ? null : (
        <div className="border-border flex rounded-lg border">
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewChange('list')}
            className="rounded-r-none"
          >
            <List size={14} />
          </Button>
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => onViewChange('kanban')}
            className="rounded-l-none"
          >
            <LayoutGrid size={14} />
          </Button>
        </div>
      )}
      {pageVariant === 'closed' ? null : (
        <Button type="button" onClick={onCreateClick}>
          <Plus size={16} />
          New Expense
        </Button>
      )}
    </PageHeader>
  );
}
