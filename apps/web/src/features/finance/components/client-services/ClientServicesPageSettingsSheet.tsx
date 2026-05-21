'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';

export interface ClientServicesPageSettingsSheetProps {
  refreshDisabled: boolean;
  onRefresh: () => void;
}

export function ClientServicesPageSettingsSheet({
  refreshDisabled,
  onRefresh,
}: ClientServicesPageSettingsSheetProps) {
  return (
    <PageSettingsSheet
      title="Client services — settings"
      description="Reload the service catalog from the server."
      triggerAriaLabel="Client services settings"
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={refreshDisabled}
        onClick={() => void onRefresh()}
      >
        <RefreshCw className="size-4 shrink-0" aria-hidden />
        Refresh list
      </Button>
    </PageSettingsSheet>
  );
}
