import { Download, LayoutGrid, List, Loader2, TableProperties } from 'lucide-react';
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
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
  statsExportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
}

export function InvoicesPageHeader({
  invoiceCount,
  period,
  view,
  onPeriodChange,
  onViewChange,
  onExportCsv,
  exportDisabled,
  exportInProgress,
  statsExportDisabled,
  onExportScopeStatsCsv,
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
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
        aria-label="Export invoice scope statistics as CSV"
        title="UTF-8 CSV snapshot from GET /finance/invoices/stats (period + optional subscription; list search/stage filters are not applied—see scope_note row)"
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
        aria-label="Export invoices as CSV"
        title="Export all rows matching current filters (paginated fetch)"
      >
        {exportInProgress ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
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
