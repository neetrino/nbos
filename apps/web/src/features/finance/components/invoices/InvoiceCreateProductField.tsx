'use client';

import { Layers } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';

interface InvoiceCreateProductFieldProps {
  productId: string;
  productLabel: string | null;
  label: string;
  placeholder: string;
  locked?: boolean;
  onSelect: (productId: string, label: string) => void;
  onClear?: () => void;
}

export function InvoiceCreateProductField({
  productId,
  productLabel,
  label,
  placeholder,
  locked = false,
  onSelect,
  onClear,
}: InvoiceCreateProductFieldProps) {
  const searchProducts = useProductRelationSearch(null);
  const productPicker = useRelationPickerActions('product');

  return (
    <RelationPickerField
      label={label}
      entityKind="product"
      value={productId || null}
      selectionLabel={productLabel}
      placeholder={placeholder}
      icon={<Layers size={12} />}
      disabled={locked}
      onSearch={searchProducts}
      onSelect={onSelect}
      onClear={locked ? undefined : onClear}
      {...productPicker}
    />
  );
}
