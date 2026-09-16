'use client';

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { clientServicesApi } from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceRegistrantFieldProps {
  serviceId: string;
  hasRegistrantData: boolean;
}

export function ClientServiceRegistrantField({
  serviceId,
  hasRegistrantData,
}: ClientServiceRegistrantFieldProps) {
  const t = useClientServicesT();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef('');

  useEffect(() => {
    if (!hasRegistrantData) return;
    let cancelled = false;
    void clientServicesApi
      .getRegistrantData(serviceId)
      .then((result) => {
        if (cancelled) return;
        const next = result.registrantData ?? '';
        setValue(next);
        lastSaved.current = next;
      })
      .catch((caught) => {
        if (!cancelled) setError(getApiErrorMessage(caught, t('domainPurchase.partialFailure')));
      });
    return () => {
      cancelled = true;
    };
  }, [hasRegistrantData, serviceId, t]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-muted-foreground text-xs font-medium">
        {t('domainPurchase.registrant')}
      </label>
      <Textarea
        value={value}
        rows={4}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => {
          if (value === lastSaved.current) return;
          void clientServicesApi
            .putRegistrantData(serviceId, value)
            .then(() => {
              lastSaved.current = value;
              setError(null);
            })
            .catch((caught) => {
              setError(getApiErrorMessage(caught, t('domainPurchase.partialFailure')));
            });
        }}
      />
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
