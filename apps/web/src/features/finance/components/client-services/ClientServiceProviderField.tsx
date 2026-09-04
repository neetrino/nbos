'use client';

import { useEffect, useState } from 'react';
import { CredentialProviderPicker } from '@/features/credentials/components/credential-provider-picker';
import { credentialsApi } from '@/lib/api/credentials';

interface ClientServiceProviderFieldProps {
  providerName: string;
  disabled?: boolean;
  onProviderChange: (name: string) => void;
}

interface ResolvedProvider {
  name: string;
  id: string | null;
}

export function ClientServiceProviderField({
  providerName,
  disabled = false,
  onProviderChange,
}: ClientServiceProviderFieldProps) {
  const name = providerName.trim();
  const [resolved, setResolved] = useState<ResolvedProvider | null>(null);

  useEffect(() => {
    if (!name) return;

    let cancelled = false;
    void credentialsApi
      .searchProviders(name)
      .then((items) => {
        if (cancelled) return;
        const match = items.find((item) => item.name.toLowerCase() === name.toLowerCase());
        setResolved({ name, id: match?.id ?? null });
      })
      .catch(() => {
        if (!cancelled) setResolved({ name, id: null });
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  const providerId =
    resolved && resolved.name.toLowerCase() === name.toLowerCase() ? resolved.id : null;

  return (
    <CredentialProviderPicker
      providerId={providerId}
      providerName={providerName}
      disabled={disabled}
      className="w-full min-w-0"
      onChange={(id, nextName) => {
        setResolved({ name: nextName, id });
        onProviderChange(nextName);
      }}
    />
  );
}
