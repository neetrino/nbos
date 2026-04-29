import { Download, Loader2, Plus, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';

interface PartnersPageHeaderProps {
  description: string;
  onRefresh: () => void;
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
  onAddPartner: () => void;
}

export function PartnersPageHeader({
  description,
  onRefresh,
  onExportCsv,
  exportDisabled,
  exportInProgress,
  onAddPartner,
}: PartnersPageHeaderProps) {
  return (
    <PageHeader title="Partners" description={description}>
      <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh partners">
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
        aria-label="Export partners as CSV"
        title="Export all rows matching current filters (paginated fetch)"
      >
        {exportInProgress ? (
          <Loader2 size={16} className="animate-spin" aria-hidden />
        ) : (
          <Download size={16} aria-hidden />
        )}
      </Button>
      <Button type="button" onClick={onAddPartner}>
        <Plus size={16} />
        Add Partner
      </Button>
    </PageHeader>
  );
}
