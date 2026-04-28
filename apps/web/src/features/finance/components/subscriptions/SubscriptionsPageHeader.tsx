import { Plus, RefreshCcw } from 'lucide-react';
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
}

export function SubscriptionsPageHeader({
  activeSubscriptions,
  totalMRR,
  period,
  onPeriodChange,
  onRefresh,
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
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCcw size={16} />
      </Button>
      <Button>
        <Plus size={16} />
        New Subscription
      </Button>
    </PageHeader>
  );
}
