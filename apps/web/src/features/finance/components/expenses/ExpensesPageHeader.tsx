'use client';

import { Plus, RefreshCcw, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';

type ViewMode = 'kanban' | 'list';

interface ExpensesPageHeaderProps {
  expenseCount: number;
  period: FinancePeriod;
  onPeriodChange: (value: FinancePeriod) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  onRefresh: () => void;
  onCreateClick: () => void;
}

export function ExpensesPageHeader({
  expenseCount,
  period,
  onPeriodChange,
  view,
  onViewChange,
  onRefresh,
  onCreateClick,
}: ExpensesPageHeaderProps) {
  return (
    <PageHeader title="Expenses" description={`${expenseCount} total`}>
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
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCcw size={16} />
      </Button>
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
      <Button type="button" onClick={onCreateClick}>
        <Plus size={16} />
        New Expense
      </Button>
    </PageHeader>
  );
}
