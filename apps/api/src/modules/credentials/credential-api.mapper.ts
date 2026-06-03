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

  const phonesRaw = credential.phones;
  const phones = Array.isArray(phonesRaw)
    ? (phonesRaw as string[]).filter((p) => typeof p === 'string' && p.trim().length > 0)
    : [];
  const legacyPhone = typeof credential.phone === 'string' ? credential.phone : null;
  const normalizedPhones =
    phones.length > 0 ? phones : legacyPhone?.trim() ? [legacyPhone.trim()] : [];

  return {
    ...base,
    providerId,
    provider: providerRel?.name ?? null,
    phones: normalizedPhones,
    phone: normalizedPhones[0] ?? null,
    appStorePlatform:
      typeof credential.appStorePlatform === 'string' ? credential.appStorePlatform : null,
  };
}
