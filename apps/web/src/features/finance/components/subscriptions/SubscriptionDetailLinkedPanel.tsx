'use client';

import { useState } from 'react';
import { Building2, FolderKanban, Handshake, Layers } from 'lucide-react';
import {
  DetailSheetEntityLinkGrid,
  DetailSheetSection,
  RelationPickerField,
} from '@/components/shared';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { useProductRelationSearch } from '@/components/shared/relation-picker/relation-search-loaders';
import { InvoiceLinkedReadonlyField } from '@/features/finance/components/invoices/InvoiceLinkedReadonlyField';
import { getApiErrorMessage } from '@/lib/api-errors';
import { subscriptionsApi, type Subscription } from '@/lib/api/finance';

export function SubscriptionDetailLinkedPanel({
  subscription,
  onSubscriptionChange,
}: {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
}) {
  const relations = useEntityRelations();
  const product = subscription.product;

  return (
    <DetailSheetSection title="Linked" outlined>
      <DetailSheetEntityLinkGrid className="sm:grid-cols-2">
        {product ? (
          <InvoiceLinkedReadonlyField
            label="Product"
            entityKind="product"
            value={product.id}
            selectionLabel={product.name}
            icon={<Layers size={12} />}
            onOpen={() => relations.openEntity('product', product.id)}
          />
        ) : (
          <SubscriptionProductLinkPicker
            subscription={subscription}
            onSubscriptionChange={onSubscriptionChange}
          />
        )}
        <InvoiceLinkedReadonlyField
          label="Project"
          entityKind="project"
          value={subscription.projectId}
          selectionLabel={subscription.project.name}
          icon={<FolderKanban size={12} />}
          onOpen={() => relations.openEntity('project', subscription.projectId)}
        />
        {subscription.company ? (
          <InvoiceLinkedReadonlyField
            label="Company"
            entityKind="company"
            value={subscription.company.id}
            selectionLabel={subscription.company.name}
            icon={<Building2 size={12} />}
            onOpen={() => relations.openEntity('company', subscription.company!.id)}
          />
        ) : null}
        {subscription.partner ? (
          <InvoiceLinkedReadonlyField
            label="Partner"
            entityKind="partner"
            value={subscription.partner.id}
            selectionLabel={subscription.partner.name}
            icon={<Handshake size={12} />}
            onOpen={() => relations.openEntity('partner', subscription.partner!.id)}
          />
        ) : null}
      </DetailSheetEntityLinkGrid>
    </DetailSheetSection>
  );
}

function SubscriptionProductLinkPicker({
  subscription,
  onSubscriptionChange,
}: {
  subscription: Subscription;
  onSubscriptionChange: (updated: Subscription) => void;
}) {
  const searchProducts = useProductRelationSearch(subscription.projectId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <RelationPickerField
        label="Product"
        entityKind="product"
        value={subscription.productId || null}
        selectionLabel={null}
        placeholder="Search products…"
        icon={<Layers size={12} />}
        disabled={saving}
        onSearch={searchProducts}
        onSelect={(productId) => {
          void linkProduct(subscription.id, productId, setSaving, setError, onSubscriptionChange);
        }}
      />
      {error ? (
        <p className="text-destructive mt-1 text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function linkProduct(
  subscriptionId: string,
  productId: string,
  setSaving: (saving: boolean) => void,
  setError: (message: string | null) => void,
  onSubscriptionChange: (updated: Subscription) => void,
): Promise<void> {
  setSaving(true);
  setError(null);
  try {
    const updated = await subscriptionsApi.update(subscriptionId, { productId });
    onSubscriptionChange(updated);
  } catch (caught) {
    setError(getApiErrorMessage(caught, 'Product could not be linked. Try again.'));
  } finally {
    setSaving(false);
  }
}
