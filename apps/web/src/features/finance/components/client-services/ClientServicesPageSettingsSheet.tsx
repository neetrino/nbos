'use client';

import { Loader2, Radar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSettingsSheet } from '@/components/shared/PageSettingsSheet';
import { useClientServicesT } from './client-service-message-keys';
import { useClientServiceRegistryCheckAll } from './use-client-service-registry-check-all';

export interface ClientServicesPageSettingsSheetProps {
  refreshDisabled: boolean;
  onRefresh: () => void;
  /** FINANCE_CLIENT_SERVICES EDIT, same gate as the per-card registry Check. */
  canCheckRegistry: boolean;
}

export function ClientServicesPageSettingsSheet({
  refreshDisabled,
  onRefresh,
  canCheckRegistry,
}: ClientServicesPageSettingsSheetProps) {
  const t = useClientServicesT();
  const registryCheckAll = useClientServiceRegistryCheckAll();
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
      {canCheckRegistry ? (
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="justify-start gap-2"
            disabled={registryCheckAll.running}
            aria-busy={registryCheckAll.running}
            onClick={registryCheckAll.start}
          >
            {registryCheckAll.running ? (
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Radar className="size-4 shrink-0" aria-hidden />
            )}
            {t('settings.checkAllDomains')}
          </Button>
          <p className="text-muted-foreground px-1 text-xs">{t('settings.checkAllDomainsHint')}</p>
        </div>
      ) : null}
    </PageSettingsSheet>
  );
}
