'use client';

import { useCallback, useEffect, useState } from 'react';
import { credentialsApi, type CredentialSecretVersion } from '@/lib/api/credentials';

export function useCredentialSecretVersions(credentialId: string | null, sheetOpen: boolean) {
  const [items, setItems] = useState<CredentialSecretVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!credentialId) return;
    setLoading(true);
    try {
      const data = await credentialsApi.getSecretVersions(credentialId);
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [credentialId]);

  useEffect(() => {
    if (sheetOpen && credentialId) void load();
  }, [sheetOpen, credentialId, load]);

  return { items, loading, reload: load };
}
