'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CredentialVaultScope } from '@/features/credentials/vault-scope';
import { vaultScopeToListTab } from '@/features/credentials/vault-scope';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { buildCredentialVaultRecentQueryParams } from '@/features/credentials/utils/credential-vault-recent-filters';
import type { CredentialVaultRecentFilterInput } from '@/features/credentials/utils/credential-vault-recent-filters';
import { credentialsApi } from '@/lib/api/credentials';

export function useCredentialsVaultRecent(
  enabled: boolean,
  vaultScope: CredentialVaultScope,
  filters: CredentialVaultRecentFilterInput,
) {
  const [items, setItems] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await credentialsApi.getRecent({
        tab: vaultScopeToListTab(vaultScope),
        ...buildCredentialVaultRecentQueryParams(filters),
      });
      setItems((data.items as unknown as CredentialListItem[]) ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, filters, vaultScope]);

  useEffect(() => {
    setItems([]);
  }, [vaultScope, filters.search, filters.quickCategory, filters.filters, filters.quickFilters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { recentCredentials: items, recentLoading: loading, refreshRecent: refresh };
}
