import { toCredentialWithoutSecrets } from './credential-health.utils';

interface ProviderRelation {
  id: string;
  name: string;
}

interface FolderMembershipRelation {
  folder?: {
    id: string;
    name: string;
  } | null;
  folderId?: string;
  isPrimary?: boolean;
}

interface FavoriteRelation {
  employeeId?: string;
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
  const favorites = Array.isArray(credential.favorites)
    ? (credential.favorites as FavoriteRelation[])
    : [];
  const folderMemberships = Array.isArray(credential.folderMemberships)
    ? (credential.folderMemberships as FolderMembershipRelation[])
    : [];

  return {
    ...base,
    providerId,
    provider: providerRel?.name ?? null,
    phones: normalizedPhones,
    phone: normalizedPhones[0] ?? null,
    appStorePlatform:
      typeof credential.appStorePlatform === 'string' ? credential.appStorePlatform : null,
    isFavorite: favorites.length > 0,
    folders: folderMemberships
      .map((membership) => {
        const folder = membership.folder;
        const id = folder?.id ?? membership.folderId;
        if (!id) return null;
        return {
          id,
          name: folder?.name ?? 'Folder',
          isPrimary: Boolean(membership.isPrimary),
        };
      })
      .filter((folder): folder is { id: string; name: string; isPrimary: boolean } =>
        Boolean(folder),
      ),
  };
}
