import { Download, Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';
import { FINANCE_PERIOD_OPTIONS, type FinancePeriod } from '@/features/finance/constants/finance';

interface PaymentsPageHeaderProps {
  visiblePaymentCount: number;
  period: FinancePeriod;
  onPeriodChange: (period: FinancePeriod) => void;
  onRefresh: () => void;
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
}

export function PaymentsPageHeader({
  visiblePaymentCount,
  period,
  onPeriodChange,
  onRefresh,
  onExportCsv,
  exportDisabled,
  exportInProgress,
}: PaymentsPageHeaderProps) {
  return (
    <PageHeader title="Payments" description={`${visiblePaymentCount} payments`}>
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
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh payments">
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
        aria-label="Export payments as CSV"
        title="Export all rows matching current search and period (paginated fetch)"
      >
        {exportInProgress ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
      </Button>
    </PageHeader>
  );
}
