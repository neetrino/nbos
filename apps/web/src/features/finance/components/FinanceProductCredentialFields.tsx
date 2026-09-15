'use client';

import { KeyRound, Layers } from 'lucide-react';
import { FormFieldRow, RelationPickerField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
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
      <FormFieldRow>
        <RelationPickerField
          label="Product"
          entityKind="product"
          value={productId}
          selectionLabel={productLabel}
          placeholder="Connect product"
          icon={<Layers size={12} />}
          disabled={disabled}
          className={FORM_FIELD_CELL_CLASS}
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
          className={FORM_FIELD_CELL_CLASS}
          onSearch={searchCredentials}
          onSelect={onCredentialSelect}
          onClear={onCredentialClear}
          {...credentialPicker}
        />
      </FormFieldRow>
      {!productId && projectHint ? (
        <p className="text-muted-foreground text-xs">Project · {projectHint}</p>
      ) : null}
    </div>
  );
}
