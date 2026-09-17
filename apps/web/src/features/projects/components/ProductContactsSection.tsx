'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import { PERSON_OVERVIEW_GRID_CLASS } from '@/components/shared/person-contact-row.constants';
import {
  useCompanyRelationSearch,
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
import { ProjectCompanyCard } from './ProjectCompanyCard';

interface ProductContactsSectionProps {
  product: FullProduct;
  onProductUpdated: (product: FullProduct) => void;
  className?: string;
  headerTitle?: string;
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
  const companyPicker = useRelationPickerActions('company', 'product-company');
  const contactSearch = useContactRelationSearch();
  const companySearch = useCompanyRelationSearch();

  useEffect(() => {
    setDraft(productContactsDraftFromProduct(product));
  }, [product]);

  const persistDraft = useCallback(
    async (next: ProductContactsDraft) => {
      const snap = productContactsDraftFromProduct(product);
      const patch = buildProductContactsPatch(snap, next);
      if (Object.keys(patch).length === 0) return;
      if (patch.contactIds && next.contactIds.length === 0) return;
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

  const handleRemoveCompany = useCallback(async () => {
    const next = { ...draft, companyId: null, companyLabel: null };
    setDraft(next);
    await persistDraft(next);
  }, [draft, persistDraft]);

  useRegisterRelationCreated(handleRelationCreated);

  const companyBlock =
    draft.companyId && draft.companyLabel ? (
      <ProjectCompanyCard
        companyId={draft.companyId}
        name={draft.companyLabel}
        disabled={saving}
        onRemove={handleRemoveCompany}
      />
    ) : (
      <RelationPickerField
        label="Company"
        entityKind="company"
        value={draft.companyId}
        selectionLabel={draft.companyLabel}
        placeholder="Search company…"
        icon={<Building2 size={12} />}
        disabled={saving}
        onSearch={companySearch}
        onSelect={(id, label) => patchDraft({ companyId: id, companyLabel: label })}
        onClear={() => patchDraft({ companyId: null, companyLabel: null })}
        {...companyPicker}
      />
    );

  return (
    <div className={cn('flex flex-col gap-3', saving && 'opacity-70', className)}>
      {companyBlock}
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
