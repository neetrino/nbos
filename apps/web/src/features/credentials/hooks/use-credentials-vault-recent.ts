'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { credentialsApi } from '@/lib/api/credentials';

export function useCredentialsVaultRecent(enabled: boolean) {
  const [items, setItems] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await credentialsApi.getRecent();
      setItems((data.items as unknown as CredentialListItem[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { recentCredentials: items, recentLoading: loading, refreshRecent: refresh };
}
