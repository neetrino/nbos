'use client';

import { useCallback, useEffect, useState } from 'react';
import { productsApi } from '@/lib/api/products';
import { credentialsApi } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  collectBoundCredentialIds,
  mapCredentialDetailToListItem,
} from '@/features/projects/utils/product-credential-mappers';

export interface UseProductCredentialsTabResult {
  credentials: CredentialListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProductCredentialsTab(
  productId: string,
  projectId: string,
  enabled: boolean,
): UseProductCredentialsTabResult {
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!productId || !projectId) return;
    setLoading(true);
    setError(null);
    try {
      const slots = await productsApi.getAccessSlots(productId);
      const boundIds = collectBoundCredentialIds(slots);
      if (boundIds.length === 0) {
        setCredentials([]);
        return;
      }
      const list = await credentialsApi.getAll({ projectId, pageSize: 200 });
      const boundSet = new Set(boundIds);
      setCredentials(
        list.items.filter((item) => boundSet.has(item.id)).map(mapCredentialDetailToListItem),
      );
    } catch {
      setError('Could not load product credentials.');
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [productId, projectId]);

  useEffect(() => {
    if (enabled) {
      void refetch();
    }
  }, [enabled, refetch]);

  return { credentials, loading, error, refetch };
}
