'use client';

import { Download, Loader2, Plus, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetSettingsMenu, PageHeader } from '@/components/shared';

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
      <DetailSheetSettingsMenu>
        <DropdownMenuItem
          disabled={statsExportDisabled}
          onClick={() => onExportScopeStatsCsv()}
          title="Workspace-wide totals from GET /api/partners/stats; list filters are not applied"
        >
          <TableProperties />
          Export scope statistics (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={exportDisabled}
          onClick={() => {
            void onExportCsv();
          }}
        >
          {exportInProgress ? <Loader2 className="animate-spin" /> : <Download />}
          Export partners (CSV)
        </DropdownMenuItem>
      </DetailSheetSettingsMenu>
      <Button type="button" onClick={onAddPartner}>
        <Plus size={16} />
        Add Partner
      </Button>
    </PageHeader>
  );
}
