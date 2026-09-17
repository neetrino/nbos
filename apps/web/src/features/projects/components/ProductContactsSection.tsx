'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import { PERSON_OVERVIEW_GRID_CLASS } from '@/components/shared/person-contact-row.constants';
import {
  useContactRelationSearch,
  useRelationPickerActions,
  useRegisterRelationCreated,
  type RelationCreatedEvent,
} from '@/components/shared/relation-picker';
import { productsApi, type FullProduct } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { applyProductContactsRelationCreated } from './apply-product-contacts-relation-created';
import {
  buildProductContactsPatch,
  productContactsDraftFromProduct,
  type ProductContactsDraft,
} from './product-contacts-state';

interface ProductContactsSectionProps {
  product: FullProduct;
  onProductUpdated: (product: FullProduct) => void;
  className?: string;
}

export function ProductContactsSection({
  product,
  onProductUpdated,
  className,
}: ProductContactsSectionProps) {
  const [draft, setDraft] = useState<ProductContactsDraft>(() =>
    productContactsDraftFromProduct(product),
  );
  const [saving, setSaving] = useState(false);
  const contactsPicker = useRelationPickerActions('contact', 'product-contacts');
  const contactSearch = useContactRelationSearch();

  useEffect(() => {
    setDraft(productContactsDraftFromProduct(product));
  }, [product]);

  const persistDraft = useCallback(
    async (next: ProductContactsDraft) => {
      const snap = productContactsDraftFromProduct(product);
      const patch = buildProductContactsPatch(snap, next);
      if (!patch.contactIds) return;
      if (next.contactIds.length === 0) return;
      setSaving(true);
      try {
        const updated = await productsApi.update(product.id, patch);
        onProductUpdated(await productsApi.getById(updated.id));
      } finally {
        setSaving(false);
      }
    },
    [product, onProductUpdated],
  );

  const patchDraft = useCallback(
    (partial: Partial<ProductContactsDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...partial };
        void persistDraft(next);
        return next;
      });
    },
    [persistDraft],
  );

  const handleRelationCreated = useCallback(
    (event: RelationCreatedEvent) => {
      setDraft((prev) => {
        const next = applyProductContactsRelationCreated(prev, event);
        void persistDraft(next);
        return next;
      });
    },
    [persistDraft],
  );

  useRegisterRelationCreated(handleRelationCreated);

  return (
    <div className={cn('flex flex-col gap-3', saving && 'opacity-70', className)}>
      <RelationPickerField
        label="Contacts"
        entityKind="contact"
        multiple
        value={draft.contactIds}
        selectionLabels={draft.contactLabels}
        placeholder="Search or create contact…"
        icon={<User size={12} />}
        disabled={saving}
        onSearch={contactSearch}
        onChange={(ids, labels) => {
          if (ids.length === 0) return;
          patchDraft({ contactIds: ids, contactLabels: labels });
        }}
        chipStackClassName={PERSON_OVERVIEW_GRID_CLASS}
        {...contactsPicker}
      />
    </div>
  );
}
