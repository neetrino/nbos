import { contactIdListsEqual } from '@nbos/shared';
import type { FullProduct } from '@/lib/api/products';
import { contactIdsAndLabelsFromRows } from '@/lib/entity-contact-list';

export type ProductContactsDraft = {
  contactIds: string[];
  contactLabels: Record<string, string>;
};

export function productContactsDraftFromProduct(product: FullProduct): ProductContactsDraft {
  const { contactIds, contactLabels } = contactIdsAndLabelsFromRows(
    product.contact,
    product.additionalContacts,
  );
  return { contactIds, contactLabels };
}

export function buildProductContactsPatch(
  snap: ProductContactsDraft,
  draft: ProductContactsDraft,
): { contactIds?: string[] } {
  if (contactIdListsEqual(draft.contactIds, snap.contactIds)) return {};
  return { contactIds: draft.contactIds };
}
