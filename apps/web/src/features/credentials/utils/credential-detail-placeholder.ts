import type { CredentialDetail } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

/**
 * Builds a partial {@link CredentialDetail} from a cached list row so the sheet can
 * render instantly on open. Secret values, decrypted comment, provider id and manual
 * grants are not known from the list and are filled in by the background detail fetch.
 */
export function credentialDetailPlaceholderFromListItem(
  item: CredentialListItem,
): CredentialDetail {
  return {
    id: item.id,
    projectId: item.project?.id ?? null,
    category: item.category,
    credentialType: item.credentialType,
    criticality: item.criticality,
    providerId: null,
    provider: item.provider,
    name: item.name,
    url: item.url,
    login: item.login,
    phone: item.phone,
    phones: item.phone ? [item.phone] : [],
    accessLevel: item.accessLevel,
    allowedEmployees: item.allowedEmployees,
    ownerId: item.ownerId ?? null,
    createdAt: item.createdAt,
    nextRotationAt: item.nextRotationAt ?? null,
    comment: null,
    manualGrants: [],
    secretsPresent: {
      password: item.secretsPresent?.password ?? false,
      passphrase: item.secretsPresent?.passphrase ?? false,
      apiKey: item.secretsPresent?.apiKey ?? false,
      envData: item.secretsPresent?.envData ?? false,
      secureNotes: item.secretsPresent?.secureNotes ?? false,
    },
    health: item.health,
    project: item.project,
    department: item.department,
    owner: item.owner,
    isFavorite: item.isFavorite,
    folders: item.folders,
  };
}
