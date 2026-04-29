import { Download, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';

interface OrdersPageHeaderProps {
  description: string;
  period: FinancePeriod;
  onPeriodChange: (period: FinancePeriod) => void;
  onRefresh: () => void;
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
}

export function OrdersPageHeader({
  description,
  period,
  onPeriodChange,
  onRefresh,
  onExportCsv,
  exportDisabled,
  exportInProgress,
}: OrdersPageHeaderProps) {
  return (
    <PageHeader title="Orders" description={description}>
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
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh orders">
        <RefreshCcw size={16} />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={exportDisabled}
        onClick={() => {
          void onExportCsv();
        }}
        aria-label="Export orders as CSV"
        title="Export all rows matching current filters (paginated fetch)"
      >
        {exportInProgress ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
      </Button>
      <Button>
        <Plus size={16} />
        New Order
      </Button>
    </PageHeader>
  );
}
