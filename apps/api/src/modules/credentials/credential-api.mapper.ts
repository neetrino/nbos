import { toCredentialWithoutSecrets } from './credential-health.utils';

interface ProviderRelation {
  id: string;
  name: string;
}

/** Maps Prisma credential row to API shape (no secrets; flattened provider). */
export function mapCredentialForApi(credential: Record<string, unknown>) {
  const providerRel = credential.provider as ProviderRelation | null | undefined;
  const base = toCredentialWithoutSecrets(credential);
  const providerId =
    providerRel?.id ?? (typeof credential.providerId === 'string' ? credential.providerId : null);

  return {
    ...base,
    providerId,
    provider: providerRel?.name ?? null,
  };
}
