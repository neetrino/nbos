'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { useClientServicesT } from './client-service-message-keys';

export interface ClientServicesPageSettingsSheetProps {
  refreshDisabled: boolean;
  onRefresh: () => void;
}

export function ClientServicesPageSettingsSheet({
  refreshDisabled,
  onRefresh,
}: ClientServicesPageSettingsSheetProps) {
  const t = useClientServicesT();
  return (
    <PageSettingsSheet
      title={t('settings.title')}
      description={t('settings.description')}
      triggerAriaLabel={t('settings.triggerAria')}
    >
      <Button
        type="button"
        variant="outline"
        className="justify-start gap-2"
        disabled={refreshDisabled}
        onClick={() => void onRefresh()}
      >
        <RefreshCw className="size-4 shrink-0" aria-hidden />
        {t('settings.refresh')}
      </Button>
    </PageSettingsSheet>
  );
}
