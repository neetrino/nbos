'use client';

import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CREDENTIAL_PROVIDER_SEARCH_LIMIT,
  CREDENTIAL_PROVIDERS_QUERY_ROOT,
  credentialProvidersQueryKey,
} from '@/features/credentials/constants/credential-provider-search';
import { credentialsApi } from '@/lib/api/credentials';

export function useCredentialProviderSearch() {
  const queryClient = useQueryClient();

  const loadProviders = useCallback(
    (query: string) =>
      queryClient.fetchQuery({
        queryKey: credentialProvidersQueryKey(query),
        queryFn: () => credentialsApi.searchProviders(query, CREDENTIAL_PROVIDER_SEARCH_LIMIT),
      }),
    [queryClient],
  );

  useEffect(() => {
    void loadProviders('');
  }, [loadProviders]);

  const invalidateProviders = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CREDENTIAL_PROVIDERS_QUERY_ROOT });
  }, [queryClient]);

  return { loadProviders, invalidateProviders };
}
