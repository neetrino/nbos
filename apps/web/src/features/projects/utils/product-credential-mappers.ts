import type { CredentialDetail } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type { ProductAccessSlotsResponse } from '@/lib/api/products';

export function collectBoundCredentialIds(slots: ProductAccessSlotsResponse): string[] {
  const ids = new Set<string>();
  for (const slot of slots.slots) {
    for (const binding of slot.bindings) {
      const id = binding.boundCredential?.id;
      if (id) ids.add(id);
    }
  }
  return [...ids];
}

export function mapCredentialDetailToListItem(detail: CredentialDetail): CredentialListItem {
  return {
    id: detail.id,
    name: detail.name,
    category: detail.category,
    credentialType: detail.credentialType,
    criticality: detail.criticality,
    provider: detail.provider,
    url: detail.url,
    login: detail.login,
    phone: detail.phone ?? null,
    appStorePlatform: detail.appStorePlatform ?? null,
    accessLevel: detail.accessLevel,
    allowedEmployees: detail.allowedEmployees,
    ownerId: detail.ownerId ?? null,
    project: detail.project ?? null,
    department: detail.department ?? null,
    owner: detail.owner ?? null,
    createdAt: detail.createdAt,
    nextRotationAt: detail.nextRotationAt ?? null,
    health: detail.health,
    secretsPresent: detail.secretsPresent,
  };
}
