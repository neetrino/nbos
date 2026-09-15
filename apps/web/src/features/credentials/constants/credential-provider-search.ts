export const CREDENTIAL_PROVIDER_SEARCH_LIMIT = 12;
export const CREDENTIAL_PROVIDERS_QUERY_ROOT = ['credentials', 'providers'] as const;

export function credentialProvidersQueryKey(query: string) {
  return [...CREDENTIAL_PROVIDERS_QUERY_ROOT, query.trim()] as const;
}
