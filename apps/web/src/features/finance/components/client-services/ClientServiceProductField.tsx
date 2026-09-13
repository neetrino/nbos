'use client';

import { Layers } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceProductFieldProps {
  productId: string;
  productLabel: string | null;
  projectLabel: string | null;
  disabled?: boolean;
  resolving?: boolean;
  required?: boolean;
  onSelect: (productId: string, label: string) => void;
}

export function ClientServiceProductField({
  productId,
  productLabel,
  projectLabel,
  disabled = false,
  resolving = false,
  required = false,
  onSelect,
}: ClientServiceProductFieldProps) {
  const t = useClientServicesT();
  const searchProducts = useProductRelationSearch(null);
  const productPicker = useRelationPickerActions('product');

  return (
    <div className="flex flex-col gap-1">
      <RelationPickerField
        label={required ? t('fields.productRequired') : t('fields.product')}
        entityKind="product"
        value={productId || null}
        selectionLabel={productLabel}
        placeholder={resolving ? t('fields.productResolving') : t('fields.productSearch')}
        icon={<Layers size={12} />}
        disabled={disabled || resolving}
        className="w-full min-w-0"
        onSearch={searchProducts}
        onSelect={onSelect}
        {...productPicker}
      />
      {projectLabel ? (
        <p className="text-muted-foreground text-xs">
          {t('fields.projectHint', { label: projectLabel })}
        </p>
      ) : null}
    </div>
  );
}
