'use client';

import { Layers } from 'lucide-react';
import {
  AmdCurrencyIcon,
  FormFieldRow,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import type { DomainPurchaseDraft } from '@/features/finance/components/domain-purchase/domain-purchase-form';

interface CreateInvoiceDomainFieldsProps {
  productId: string;
  productLabel: string | null;
  draft: DomainPurchaseDraft;
  productLabelText: string;
  productSearchText: string;
  amountLabel: string;
  productLocked?: boolean;
  previewKind?: string | null;
  onProductSelect: (productId: string, label: string) => void;
  onDraftChange: (draft: DomainPurchaseDraft) => void;
}

export function CreateInvoiceDomainFields({
  productId,
  productLabel,
  draft,
  productLabelText,
  productSearchText,
  amountLabel,
  productLocked = false,
  previewKind,
  onProductSelect,
  onDraftChange,
}: CreateInvoiceDomainFieldsProps) {
  const tCs = useClientServicesT();
  const searchProducts = useProductRelationSearch(null);
  const productPicker = useRelationPickerActions('product');
  const row = draft.domains[0];

  return (
    <div className="flex flex-col gap-3">
      <RelationPickerField
        label={productLabelText}
        entityKind="product"
        value={productId || null}
        selectionLabel={productLabel}
        placeholder={productSearchText}
        icon={<Layers size={12} />}
        disabled={productLocked}
        onSearch={searchProducts}
        onSelect={onProductSelect}
        {...productPicker}
      />
      <FormFieldRow layout="wideStart">
        <InlineField
          variant="controlled"
          label={tCs('domainPurchase.domainName')}
          className={FORM_FIELD_CELL_CLASS}
          value={row?.domainName ?? ''}
          onValueChange={(domainName) =>
            onDraftChange({
              ...draft,
              domains: [{ ...(row ?? draft.domains[0]!), domainName }],
            })
          }
        />
        <InlineField
          variant="controlled"
          label={amountLabel}
          type="money"
          className={FORM_FIELD_CELL_CLASS}
          value={row?.costAmd ?? ''}
          icon={<AmdCurrencyIcon className="text-muted-foreground/70" />}
          onValueChange={(costAmd) =>
            onDraftChange({
              ...draft,
              domains: [{ ...(row ?? draft.domains[0]!), costAmd }],
            })
          }
        />
      </FormFieldRow>
      {previewKind ? (
        <p className="text-muted-foreground text-xs">{previewLabel(tCs, previewKind)}</p>
      ) : null}
    </div>
  );
}

function previewLabel(t: ReturnType<typeof useClientServicesT>, kind: string): string {
  if (kind === 'continue_initial') return t('domainPurchase.previewContinue');
  if (kind === 'renewal') return t('domainPurchase.previewRenewal');
  if (kind === 'existing_invoice') return t('domainPurchase.previewExistingInvoice');
  if (kind === 'other_product') return t('domainPurchase.previewOtherProduct');
  return t('domainPurchase.previewNew');
}
