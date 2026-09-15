import {
  CREDENTIAL_CATEGORY_CODES,
  getAccessSlotsForProduct,
  UNIVERSAL_ACCESS_SLOT_KEY,
  type AccessSlotDefinition,
} from '@nbos/shared';
import {
  redactAccessSlotCredential,
  type AccessSlotBoundCredentialDto,
} from './product-access-slot-redact';

const KNOWN_ORPHAN_SLOT_LABELS: Record<string, string> = {
  DOMAIN: 'Domain account',
  HOSTING: 'Hosting account',
  ADMIN: 'Admin / CMS access',
  MAIL: 'Mail account',
  SERVICE: 'Service account',
  API_INTEGRATION: 'API / integration',
  APP_STORE: 'App store account',
  DATABASE: 'Database access',
  [UNIVERSAL_ACCESS_SLOT_KEY]: 'Other / not listed',
};

export const BINDING_CREDENTIAL_SELECT = {
  id: true,
  name: true,
  category: true,
  credentialType: true,
  login: true,
  url: true,
  trashedAt: true,
} as const;

export type BindingCredential = {
  id: string;
  name: string;
  category: string;
  credentialType: string;
  login: string | null;
  url: string | null;
  trashedAt: Date | null;
};

export type AccessSlotBindingEntry = {
  bindingId: string;
  boundCredential: AccessSlotBoundCredentialDto | null;
};

export type ProductAccessSlotRowDto = {
  slotKey: string;
  label: string;
  required: boolean;
  kind: 'credential';
  allowedCategories: string[];
  defaultCredentialType: string | null;
  bindings: AccessSlotBindingEntry[];
};

export function buildAccessSlotRows(
  productCategory: string,
  productType: string,
  bindings: Array<{ id: string; slotKey: string; credential: BindingCredential }>,
  revealable: Set<string>,
): ProductAccessSlotRowDto[] {
  const definitions = getAccessSlotsForProduct(productCategory, productType);
  const definitionKeys = new Set(definitions.map((def) => def.slotKey));
  const bySlot = new Map<string, typeof bindings>();
  for (const binding of bindings) {
    const list = bySlot.get(binding.slotKey) ?? [];
    list.push(binding);
    bySlot.set(binding.slotKey, list);
  }
  const rows = definitions.map((def) =>
    mapDefinitionToRow(def, bySlot.get(def.slotKey) ?? [], revealable),
  );
  for (const slotKey of [...bySlot.keys()].filter((key) => !definitionKeys.has(key)).sort()) {
    rows.push(orphanRow(slotKey, bySlot.get(slotKey) ?? [], revealable));
  }
  return rows;
}

function mapDefinitionToRow(
  def: AccessSlotDefinition,
  slotBindings: Array<{ id: string; credential: BindingCredential }>,
  revealable: Set<string>,
): ProductAccessSlotRowDto {
  return {
    slotKey: def.slotKey,
    label: def.label,
    required: def.required,
    kind: def.kind,
    allowedCategories: [...def.allowedCategories],
    defaultCredentialType: def.defaultCredentialType ?? null,
    bindings: slotBindings.map((binding) => toBindingEntry(binding, revealable)),
  };
}

function orphanRow(
  slotKey: string,
  slotBindings: Array<{ id: string; credential: BindingCredential }>,
  revealable: Set<string>,
): ProductAccessSlotRowDto {
  return {
    slotKey,
    label: KNOWN_ORPHAN_SLOT_LABELS[slotKey] ?? slotKey,
    required: false,
    kind: 'credential',
    allowedCategories: [...CREDENTIAL_CATEGORY_CODES],
    defaultCredentialType: null,
    bindings: slotBindings.map((binding) => toBindingEntry(binding, revealable)),
  };
}

function toBindingEntry(
  binding: { id: string; credential: BindingCredential },
  revealable: Set<string>,
): AccessSlotBindingEntry {
  if (binding.credential.trashedAt) {
    return { bindingId: binding.id, boundCredential: null };
  }
  return {
    bindingId: binding.id,
    boundCredential: redactAccessSlotCredential(
      binding.credential,
      revealable.has(binding.credential.id),
    ),
  };
}
