import type { CredentialDetail } from '@/lib/api/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import type {
  ProductAccessSlotBoundCredential,
  ProductAccessSlotsResponse,
} from '@/lib/api/products';

const EMPTY_SECRETS = {
  password: false,
  passphrase: false,
  apiKey: false,
  envData: false,
  secureNotes: false,
};

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
    product: detail.product ?? null,
    department: detail.department ?? null,
    owner: detail.owner ?? null,
    createdAt: detail.createdAt,
    nextRotationAt: detail.nextRotationAt ?? null,
    health: detail.health,
    secretsPresent: detail.secretsPresent,
  };
}

export function findBoundCredential(
  slots: ProductAccessSlotsResponse,
  credentialId: string,
): ProductAccessSlotBoundCredential | null {
  for (const slot of slots.slots) {
    for (const binding of slot.bindings) {
      if (binding.boundCredential?.id === credentialId) return binding.boundCredential;
    }
  }
  return null;
}

export function mapBoundSlotCredentialToListItem(
  bound: ProductAccessSlotBoundCredential,
): CredentialListItem {
  const canReveal = bound.canReveal !== false;
  return {
    id: bound.id,
    name: bound.name,
    category: bound.category,
    credentialType: bound.credentialType,
    criticality: 'MEDIUM',
    provider: null,
    url: canReveal ? bound.url : null,
    login: canReveal ? bound.login : null,
    phone: null,
    accessLevel: canReveal ? 'PROJECT_TEAM' : 'SECRET',
    allowedEmployees: [],
    project: null,
    department: null,
    owner: null,
    createdAt: new Date(0).toISOString(),
    secretsPresent: EMPTY_SECRETS,
  };
}
