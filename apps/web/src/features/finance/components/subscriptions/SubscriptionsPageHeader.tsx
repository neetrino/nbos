import { Download, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import {
  FINANCE_PERIOD_OPTIONS,
  type FinancePeriod,
  formatAmount,
} from '@/features/finance/constants/finance';

interface SubscriptionsPageHeaderProps {
  activeSubscriptions: number;
  totalMRR: number;
  period: FinancePeriod;
  onPeriodChange: (period: FinancePeriod) => void;
  onRefresh: () => void;
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
}

export function SubscriptionsPageHeader({
  activeSubscriptions,
  totalMRR,
  period,
  onPeriodChange,
  onRefresh,
  onExportCsv,
  exportDisabled,
  exportInProgress,
}: SubscriptionsPageHeaderProps) {
  return (
    <PageHeader
      title="Subscriptions"
      description={`${activeSubscriptions} active, MRR ${formatAmount(totalMRR)}`}
    >
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
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh subscriptions">
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
        aria-label="Export subscriptions as CSV"
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
        New Subscription
      </Button>
    </PageHeader>
  );
}
