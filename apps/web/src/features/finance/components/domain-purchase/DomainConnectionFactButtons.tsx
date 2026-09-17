'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import {
  clientServicesApi,
  type ClientServiceRecord,
  type DomainConnectionMode,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';

interface DomainConnectionFactButtonsProps {
  service: ClientServiceRecord;
  mode: DomainConnectionMode | null;
  canEdit: boolean;
  onServiceUpdated: (service: ClientServiceRecord) => void;
}

export function DomainConnectionFactButtons({
  service,
  mode,
  canEdit,
  onServiceUpdated,
}: DomainConnectionFactButtonsProps) {
  const t = useClientServicesT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canEdit || mode === 'CLIENT_DNS' || !mode) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || Boolean(service.registrationConfirmedAt)}
          onClick={() =>
            void runFact(
              () => clientServicesApi.confirmRegistration(service.id),
              setBusy,
              setError,
              onServiceUpdated,
            )
          }
        >
          {t('domainPurchase.confirmRegistration')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || Boolean(service.connectionVerifiedAt) || !service.providerAccountId}
          onClick={() =>
            void runFact(
              () => clientServicesApi.confirmConnection(service.id),
              setBusy,
              setError,
              onServiceUpdated,
            )
          }
        >
          {t('domainPurchase.confirmConnection')}
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function runFact(
  action: () => Promise<ClientServiceRecord>,
  setBusy: (value: boolean) => void,
  setError: (value: string | null) => void,
  onServiceUpdated: (service: ClientServiceRecord) => void,
): Promise<void> {
  setBusy(true);
  setError(null);
  try {
    onServiceUpdated(await action());
  } catch (caught) {
    setError(getApiErrorMessage(caught, 'Update failed'));
  } finally {
    setBusy(false);
  }
}
