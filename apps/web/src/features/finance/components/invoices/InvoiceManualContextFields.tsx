'use client';

import { useState } from 'react';
import { Building2, Layers } from 'lucide-react';
import { RelationPickerField } from '@/components/shared';
import {
  useCompanyRelationSearch,
  useProductRelationSearch,
  useRelationPickerActions,
} from '@/components/shared/relation-picker';
import { invoiceStageGateFieldClass } from '@/features/finance/constants/invoice-stage-gate-highlight';
import {
  INVOICE_GATE_FIELD_COMPANY,
  INVOICE_GATE_FIELD_PRODUCT,
} from '@/features/finance/constants/invoice-money-status-gate-client';
import type { InvoiceGeneralDraft } from '@/features/finance/utils/invoice-general-form-state';
import type { Invoice } from '@/lib/api/finance';

interface InvoiceManualContextFieldsProps {
  invoice: Invoice;
  draft: InvoiceGeneralDraft;
  patchDraft: (partial: Partial<InvoiceGeneralDraft>) => void;
  gateRequiredFields: ReadonlySet<string>;
  disabled?: boolean;
  /** Issued invoice: open the link, do not change it. */
  readOnly?: boolean;
  /** Participate in a parent link grid instead of a nested grid. */
  embedded?: boolean;
}

export function InvoiceManualContextFields({
  invoice,
  draft,
  patchDraft,
  gateRequiredFields,
  disabled = false,
  readOnly = false,
  embedded = false,
}: InvoiceManualContextFieldsProps) {
  const labelSeed = `${invoice.id}:${invoice.company?.name ?? ''}:${invoice.product?.name ?? ''}`;
  const [labelSeedSeen, setLabelSeedSeen] = useState(labelSeed);
  const [companyLabel, setCompanyLabel] = useState(invoice.company?.name ?? null);
  const [productLabel, setProductLabel] = useState(invoice.product?.name ?? null);

  if (labelSeed !== labelSeedSeen) {
    setLabelSeedSeen(labelSeed);
    setCompanyLabel(invoice.company?.name ?? null);
    setProductLabel(invoice.product?.name ?? null);
  }

  const searchCompanies = useCompanyRelationSearch();
  const searchProducts = useProductRelationSearch(null);
  const companyPicker = useRelationPickerActions('company');
  const productPicker = useRelationPickerActions('product');
  const showProductPicker = invoice.type === 'MANUAL';
  const canChange = !disabled && !readOnly;

  return (
    <div
      className={
        embedded ? 'contents' : showProductPicker ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3'
      }
    >
      <RelationPickerField
        label="Company"
        entityKind="company"
        value={draft.companyId}
        selectionLabel={companyLabel}
        placeholder="Search companies…"
        icon={<Building2 size={12} />}
        onSearch={searchCompanies}
        onSelect={(id, label) => {
          patchDraft({ companyId: id });
          setCompanyLabel(label);
        }}
        onClear={
          canChange
            ? () => {
                patchDraft({ companyId: null });
                setCompanyLabel(null);
              }
            : undefined
        }
        disabled={disabled}
        readOnly={readOnly}
        className={invoiceStageGateFieldClass(gateRequiredFields, INVOICE_GATE_FIELD_COMPANY)}
        {...companyPicker}
      />
      {showProductPicker ? (
        <RelationPickerField
          label="Product"
          entityKind="product"
          value={draft.productId}
          selectionLabel={productLabel}
          placeholder="Search products…"
          icon={<Layers size={12} />}
          onSearch={searchProducts}
          onSelect={(id, label) => {
            patchDraft({ productId: id });
            setProductLabel(label);
          }}
          onClear={
            canChange
              ? () => {
                  patchDraft({ productId: null });
                  setProductLabel(null);
                }
              : undefined
          }
          disabled={disabled}
          readOnly={readOnly}
          className={invoiceStageGateFieldClass(gateRequiredFields, INVOICE_GATE_FIELD_PRODUCT)}
          {...productPicker}
        />
      ) : null}
    </div>
  );
}
