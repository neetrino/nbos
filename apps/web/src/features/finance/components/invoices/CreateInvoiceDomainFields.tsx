'use client';

import { Layers } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { DomainPurchaseDomainRows } from '@/features/finance/components/domain-purchase/DomainPurchaseDomainRows';
import type { DomainPurchaseDraft } from '@/features/finance/components/domain-purchase/domain-purchase-form';

interface CreateInvoiceDomainFieldsProps {
  productId: string;
  productLabel: string | null;
  draft: DomainPurchaseDraft;
  productLabelText: string;
  productSearchText: string;
  onProductSelect: (productId: string, label: string) => void;
  onDraftChange: (draft: DomainPurchaseDraft) => void;
}

export function CreateInvoiceDomainFields({
  productId,
  productLabel,
  draft,
  productLabelText,
  productSearchText,
  onProductSelect,
  onDraftChange,
}: CreateInvoiceDomainFieldsProps) {
  const searchProducts = useProductRelationSearch(null);
  const productPicker = useRelationPickerActions('product');

  return (
    <div className="flex flex-col gap-3">
      <RelationPickerField
        label={productLabelText}
        entityKind="product"
        value={productId || null}
        selectionLabel={productLabel}
        placeholder={productSearchText}
        icon={<Layers size={12} />}
        onSearch={searchProducts}
        onSelect={onProductSelect}
        {...productPicker}
      />
      <DomainPurchaseDomainRows draft={draft} requireClientAmount onChange={onDraftChange} />
    </div>
  );
}
