'use client';

import { Layers } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import type { RelationPickerSearchFn } from '@/components/shared/relation-picker';
import type { Subscription } from '@/lib/api/finance';

interface SubscriptionFormDialogProductFieldProps {
  mode: 'create' | 'edit';
  productLocked: boolean;
  productId: string;
  productLabel: string | null;
  productResolving: boolean;
  subscription?: Subscription | null;
  searchProducts: RelationPickerSearchFn;
  productPicker: {
    onCreate?: (searchQuery: string) => void;
    onOpenSelected: (id: string) => void;
  };
  onProductSelect: (productId: string, label: string) => void;
}

export function SubscriptionFormDialogProductField({
  mode,
  productLocked,
  productId,
  productLabel,
  productResolving,
  subscription,
  searchProducts,
  productPicker,
  onProductSelect,
}: SubscriptionFormDialogProductFieldProps) {
  if (mode === 'create' && !productLocked) {
    return (
      <RelationPickerField
        label="Product"
        entityKind="product"
        value={productId || null}
        selectionLabel={productLabel}
        placeholder={productResolving ? 'Resolving product…' : 'Search products…'}
        icon={<Layers size={12} />}
        disabled={productResolving}
        onSearch={searchProducts}
        onSelect={(id, label) => {
          onProductSelect(id, label);
        }}
        {...productPicker}
      />
    );
  }

  return (
    <div className="text-muted-foreground text-sm">
      Product: {subscription?.product?.name ?? productLabel ?? productId}
      {subscription?.project ? ` · Project ${subscription.project.name}` : null}
    </div>
  );
}
