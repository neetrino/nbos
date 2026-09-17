import { contactIdListsEqual } from '@nbos/shared';
import type { FullProduct } from '@/lib/api/products';
import { contactIdsAndLabelsFromRows } from '@/lib/entity-contact-list';

export type ProductContactsDraft = {
  contactIds: string[];
  contactLabels: Record<string, string>;
  companyId: string | null;
  companyLabel: string | null;
};

export type ProductContactsUpdatePayload = {
  contactIds?: string[];
  companyId?: string | null;
};

export function productContactsDraftFromProduct(product: FullProduct): ProductContactsDraft {
  const { contactIds, contactLabels } = contactIdsAndLabelsFromRows(
    product.contact,
    product.additionalContacts,
  );
  return {
    contactIds,
    contactLabels,
    companyId: product.company?.id ?? product.companyId ?? null,
    companyLabel: product.company?.name ?? null,
  };
}

export function buildProductContactsPatch(
  snap: ProductContactsDraft,
  draft: ProductContactsDraft,
): ProductContactsUpdatePayload {
  const out: ProductContactsUpdatePayload = {};
  if (draft.companyId !== snap.companyId) out.companyId = draft.companyId;
  if (!contactIdListsEqual(draft.contactIds, snap.contactIds)) {
    out.contactIds = draft.contactIds;
  }
  return out;
}
