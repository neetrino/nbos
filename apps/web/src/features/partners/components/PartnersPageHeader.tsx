import { Download, Loader2, Plus, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared';

interface PartnersPageHeaderProps {
  description: string;
  onExportCsv: () => void | Promise<void>;
  exportDisabled: boolean;
  exportInProgress: boolean;
  statsExportDisabled: boolean;
  onExportScopeStatsCsv: () => void;
  onAddPartner: () => void;
}

export function PartnersPageHeader({
  description,
  onExportCsv,
  exportDisabled,
  exportInProgress,
  statsExportDisabled,
  onExportScopeStatsCsv,
  onAddPartner,
}: PartnersPageHeaderProps) {
  return (
    <PageHeader title="Partners" description={description}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={statsExportDisabled}
        onClick={() => onExportScopeStatsCsv()}
        aria-label="Export partner scope statistics as CSV"
        title="UTF-8 CSV snapshot from GET /api/partners/stats (workspace-wide totals; list filters not applied—see scope_note row)"
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
