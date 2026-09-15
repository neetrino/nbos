'use client';

import { useCallback, useEffect, useState } from 'react';
import { productsApi } from '@/lib/api/products';
import { credentialsApi } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import {
  collectBoundCredentialIds,
  findBoundCredential,
  mapBoundSlotCredentialToListItem,
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
      setCredentials(await loadProductCredentials(productId, projectId));
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

async function loadProductCredentials(
  productId: string,
  projectId: string,
): Promise<CredentialListItem[]> {
  const slots = await productsApi.getAccessSlots(productId);
  const boundIds = collectBoundCredentialIds(slots);
  const list = await credentialsApi.getAll({ projectId, pageSize: 200 });
  const byId = new Map<string, CredentialListItem>();
  for (const item of list.items) {
    if (boundIds.includes(item.id) || item.productId === productId) {
      byId.set(item.id, mapCredentialDetailToListItem(item));
    }
  }
  const missing = boundIds.filter((id) => !byId.has(id));
  await Promise.all(
    missing.map(async (id) => {
      try {
        const detail = await credentialsApi.getById(id);
        byId.set(id, mapCredentialDetailToListItem(detail));
      } catch {
        const bound = findBoundCredential(slots, id);
        if (bound) byId.set(id, mapBoundSlotCredentialToListItem(bound));
      }
    }),
  );
  return [...byId.values()];
}
