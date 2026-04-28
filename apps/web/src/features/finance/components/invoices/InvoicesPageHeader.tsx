import { LayoutGrid, List, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';
import type { InvoiceViewMode } from './invoice-page-types';

interface InvoicesPageHeaderProps {
  invoiceCount: number;
  period: FinancePeriod;
  view: InvoiceViewMode;
  onPeriodChange: (period: FinancePeriod) => void;
  onViewChange: (view: InvoiceViewMode) => void;
  onRefresh: () => void;
}

export function InvoicesPageHeader({
  invoiceCount,
  period,
  view,
  onPeriodChange,
  onViewChange,
  onRefresh,
}: InvoicesPageHeaderProps) {
  return (
    <PageHeader title="Invoices" description={`${invoiceCount} total`}>
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
      <InvoiceViewToggle view={view} onViewChange={onViewChange} />
    </PageHeader>
  );
}

function InvoiceViewToggle({
  view,
  onViewChange,
}: {
  view: InvoiceViewMode;
  onViewChange: (view: InvoiceViewMode) => void;
}) {
  return (
    <div className="border-border flex rounded-lg border">
      <Button
        variant={view === 'kanban' ? 'secondary' : 'ghost'}
        size="icon-sm"
        onClick={() => onViewChange('kanban')}
        className="rounded-r-none"
      >
        <LayoutGrid size={14} />
      </Button>
      <Button
        variant={view === 'list' ? 'secondary' : 'ghost'}
        size="icon-sm"
        onClick={() => onViewChange('list')}
        className="rounded-l-none"
      >
        <List size={14} />
      </Button>
    </div>
  );
}
