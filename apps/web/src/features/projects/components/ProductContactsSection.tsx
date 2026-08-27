'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import { DETAIL_SHEET_SECTION_TITLE_CLASS } from '@/components/shared/detail-sheet-classes';
import {
  useContactRelationSearch,
  useRelationPickerActions,
  useRegisterRelationCreated,
  type RelationCreatedEvent,
} from '@/components/shared/relation-picker';
import { productsApi, type FullProduct } from '@/lib/api/products';
import { cn } from '@/lib/utils';
import { applyProductContactsRelationCreated } from './apply-product-contacts-relation-created';
import { ProjectContactCard, type ProjectContactCardModel } from './ProjectContactCard';
import {
  buildProductContactsPatch,
  productContactsDraftFromProduct,
  type ProductContactsDraft,
} from './product-contacts-state';

interface ProductContactsSectionProps {
  product: FullProduct;
  onProductUpdated: (product: FullProduct) => void;
  /** When set, title + compact search share one header row. */
  headerTitle?: string;
  className?: string;
}

const CONTACTS_HEADER_SEARCH_CLASS = 'w-[55%] max-w-[55%] shrink-0';
const CONTACTS_HEADER_SEARCH_PLACEHOLDER = 'Search…';
const CONTACTS_HEADER_TITLE_CLASS = cn(
  DETAIL_SHEET_SECTION_TITLE_CLASS,
  'mb-0 shrink-0 text-xs',
);

function buildContactCards(
  product: FullProduct,
  draft: ProductContactsDraft,
): ProjectContactCardModel[] {
  const emailById = new Map<string, string | null>();
  for (const row of product.additionalContacts ?? []) {
    emailById.set(row.contact.id, row.contact.email ?? null);
  }
  if (product.contact) {
    emailById.set(product.contact.id, product.contact.email ?? null);
  }
  return draft.contactIds.map((id) => ({
    id,
    name: draft.contactLabels[id] ?? id,
    email: emailById.get(id) ?? null,
    isPrimary: product.contact?.id === id,
  }));
}

export function ProductContactsSection({
  product,
  onProductUpdated,
  headerTitle,
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

  const contactCards = useMemo(() => buildContactCards(product, draft), [product, draft]);

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

  const handleRemoveContact = useCallback(
    async (contactId: string) => {
      const nextIds = draft.contactIds.filter((id) => id !== contactId);
      if (nextIds.length === 0) return;
      const nextLabels = { ...draft.contactLabels };
      delete nextLabels[contactId];
      const next = { ...draft, contactIds: nextIds, contactLabels: nextLabels };
      setDraft(next);
      await persistDraft(next);
    },
    [draft, persistDraft],
  );

  useRegisterRelationCreated(handleRelationCreated);

  const searchField = (
    <RelationPickerField
      label=""
      entityKind="contact"
      multiple
      selectionDisplay="none"
      value={draft.contactIds}
      selectionLabels={draft.contactLabels}
      placeholder={
        headerTitle ? CONTACTS_HEADER_SEARCH_PLACEHOLDER : 'Search or create contact…'
      }
      icon={<User size={12} />}
      disabled={saving}
      onSearch={contactSearch}
      onChange={(ids, labels) => patchDraft({ contactIds: ids, contactLabels: labels })}
      className={headerTitle ? CONTACTS_HEADER_SEARCH_CLASS : undefined}
      {...contactsPicker}
    />
  );

  return (
    <div className={cn('flex flex-col gap-3', saving && 'opacity-70', className)}>
      {headerTitle ? (
        <div className="flex items-center justify-between gap-2">
          <p className={CONTACTS_HEADER_TITLE_CLASS}>{headerTitle}</p>
          {searchField}
        </div>
      ) : (
        searchField
      )}
      {contactCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {contactCards.map((contact) => (
            <ProjectContactCard
              key={contact.id}
              contact={contact}
              disabled={saving || draft.contactIds.length <= 1}
              onRemove={handleRemoveContact}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
