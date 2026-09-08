'use client';

import { KeyRound, Layers } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCredentialRelationSearch,
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';

export interface FinanceProductCredentialFieldsProps {
  productId: string | null;
  productLabel: string | null;
  credentialId: string | null;
  credentialLabel: string | null;
  projectHint?: string | null;
  disabled?: boolean;
  onProductSelect: (id: string, label: string) => void;
  onProductClear: () => void;
  onCredentialSelect: (id: string, label: string) => void;
  onCredentialClear: () => void;
}

export function FinanceProductCredentialFields({
  productId,
  productLabel,
  credentialId,
  credentialLabel,
  projectHint,
  disabled = false,
  onProductSelect,
  onProductClear,
  onCredentialSelect,
  onCredentialClear,
}: FinanceProductCredentialFieldsProps) {
  const searchProducts = useProductRelationSearch(null);
  const searchCredentials = useCredentialRelationSearch(null);
  const productPicker = useRelationPickerActions('product');
  const credentialPicker = useRelationPickerActions('credential');

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <RelationPickerField
          label="Product"
          entityKind="product"
          value={productId}
          selectionLabel={productLabel}
          placeholder="Connect product"
          icon={<Layers size={12} />}
          disabled={disabled}
          onSearch={searchProducts}
          onSelect={onProductSelect}
          onClear={onProductClear}
          {...productPicker}
        />
        <RelationPickerField
          label="Credentials"
          entityKind="credential"
          value={credentialId}
          selectionLabel={credentialLabel}
          placeholder="Connect credentials"
          icon={<KeyRound size={12} />}
          disabled={disabled}
          onSearch={searchCredentials}
          onSelect={onCredentialSelect}
          onClear={onCredentialClear}
          {...credentialPicker}
        />
      </div>
      {!productId && projectHint ? (
        <p className="text-muted-foreground text-xs">Project · {projectHint}</p>
      ) : null}
    </div>
  );
}
