'use client';

import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FolderKanban,
  Layers,
  Receipt,
  Tag,
} from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { DEAL_TYPES, PAYMENT_TYPES, PRODUCT_CATEGORIES } from '../constants/dealPipeline';
import type { SearchLoader } from './deal-general-tab.types';
import type { DealGeneralDraft } from './deal-general-form-state';
import { TAX_STATUS_OPTIONS } from './deal-general-tab.helpers';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';

interface DealInfoFieldsProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  searchProjects: SearchLoader;
  searchProducts: SearchLoader;
  searchCompanies: SearchLoader;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

/** Left column: project, company, and commercial basics. */
export function DealInfoProjectBillingFields({
  draft,
  patchDraft,
  searchProjects,
  searchCompanies,
  disabled = false,
  gateRequiredFields = new Set(),
}: Pick<
  DealInfoFieldsProps,
  'draft' | 'patchDraft' | 'searchProjects' | 'searchCompanies' | 'disabled' | 'gateRequiredFields'
>) {
  const projectPicker = useRelationPickerActions('project');
  const companyPicker = useRelationPickerActions('company');

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <InlineField
        variant="controlled"
        label="Cost"
        type="money"
        value={draft.amount ?? ''}
        placeholder="Enter amount..."
        icon={<DollarSign size={12} />}
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'amount')}
        onValueChange={(v) => patchDraft({ amount: v === '' ? null : Number(v) })}
      />

      <InlineField
        variant="controlled"
        label="Tax Status"
        type="select"
        value={draft.taxStatus}
        options={TAX_STATUS_OPTIONS.map((type) => ({ value: type.value, label: type.label }))}
        placeholder="Tax / Tax Free"
        icon={<Receipt size={12} />}
        disabled={disabled}
        onValueChange={(v) => patchDraft({ taxStatus: v })}
      />

      <InlineField
        variant="controlled"
        label="Payment Type"
        type="select"
        value={draft.paymentType ?? ''}
        options={PAYMENT_TYPES.map((type) => ({ value: type.value, label: type.label }))}
        placeholder="Select payment type..."
        icon={<CreditCard size={12} />}
        clearable
        disabled={disabled}
        className={dealStageGateFieldClass(gateRequiredFields, 'paymentType')}
        onValueChange={(v) => patchDraft({ paymentType: v || null })}
      />

      <RelationPickerField
        label="Project"
        entityKind="project"
        value={draft.projectId}
        selectionLabel={draft.linkedProjectLabel}
        disabled={disabled}
        placeholder="Search projects…"
        icon={<FolderKanban size={12} />}
        onSearch={searchProjects}
        onSelect={(id, label) => patchDraft({ projectId: id, linkedProjectLabel: label })}
        onClear={() => patchDraft({ projectId: null, linkedProjectLabel: null })}
        {...projectPicker}
      />

      {(draft.taxStatus ?? 'TAX') === 'TAX' && (
        <RelationPickerField
          label="Company"
          entityKind="company"
          value={draft.companyId}
          selectionLabel={draft.companyPickLabel}
          className={dealStageGateFieldClass(gateRequiredFields, 'companyId')}
          disabled={disabled}
          placeholder="Search company…"
          icon={<Building2 size={12} />}
          onSearch={searchCompanies}
          onSelect={(id, label) => patchDraft({ companyId: id, companyPickLabel: label })}
          onClear={() => patchDraft({ companyId: null, companyPickLabel: null })}
          {...companyPicker}
        />
      )}
    </div>
  );
}

/** Right column: deal type and product taxonomy. */
export function DealInfoDealProductFields({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  searchProducts,
  disabled = false,
  gateRequiredFields = new Set(),
}: Omit<DealInfoFieldsProps, 'searchProjects' | 'searchCompanies'>) {
  const productPicker = useRelationPickerActions(
    'product',
    'deal-existing-product',
    draft.projectId ? { projectId: draft.projectId } : undefined,
  );
  const isExtension = draft.type === 'EXTENSION';
  const isProductLike = draft.type === 'PRODUCT' || draft.type === 'OUTSOURCE';

  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <InlineField
        variant="controlled"
        label="Deal Type"
        type="select"
        value={draft.type}
        options={DEAL_TYPES.map((type) => ({ value: type.value, label: type.label }))}
        icon={<Layers size={12} />}
        disabled={disabled}
        onValueChange={(v) => {
          if (v) patchDraft({ type: v });
        }}
      />

      {isProductLike && (
        <InlineField
          variant="controlled"
          label="Product Category"
          type="select"
          value={draft.productCategory ?? ''}
          options={PRODUCT_CATEGORIES.map((category) => ({
            value: category.value,
            label: category.label,
          }))}
          placeholder="Select category..."
          icon={<Layers size={12} />}
          clearable
          disabled={disabled}
          className={dealStageGateFieldClass(gateRequiredFields, 'productCategory')}
          onValueChange={(v) => {
            if (!v) {
              patchDraft({ productCategory: null, productType: null });
              return;
            }
            patchDraft({ productCategory: v, productType: null });
          }}
        />
      )}

      {isProductLike && draft.productCategory && (
        <InlineField
          variant="controlled"
          label="Product Type"
          type="select"
          value={draft.productType ?? ''}
          options={filteredProductTypeOptions}
          placeholder="Select product type..."
          icon={<Tag size={12} />}
          clearable
          disabled={disabled}
          className={dealStageGateFieldClass(gateRequiredFields, 'productType')}
          onValueChange={(v) => patchDraft({ productType: v || null })}
        />
      )}

      {draft.type === 'MAINTENANCE' && (
        <InlineField
          variant="controlled"
          label="Planned Maintenance Start"
          type="date"
          value={draft.maintenanceStartAt ?? ''}
          placeholder="Select start date..."
          icon={<Calendar size={12} />}
          disabled={disabled}
          onValueChange={(v) => patchDraft({ maintenanceStartAt: v || null })}
        />
      )}

      {isExtension && (
        <RelationPickerField
          label="Existing Product"
          entityKind="product"
          value={draft.existingProductId}
          selectionLabel={draft.existingProductPickLabel}
          className={dealStageGateFieldClass(gateRequiredFields, 'existingProductId')}
          disabled={disabled}
          placeholder="Search products…"
          icon={<Layers size={12} />}
          onSearch={searchProducts}
          onSelect={(id, label) =>
            patchDraft({ existingProductId: id, existingProductPickLabel: label })
          }
          onClear={() => patchDraft({ existingProductId: null, existingProductPickLabel: null })}
          {...productPicker}
        />
      )}

      {draft.type !== 'MAINTENANCE' && (
        <InlineField
          variant="controlled"
          label="Deadline"
          type="date"
          datePickerVariant="extended"
          value={draft.deadline ?? ''}
          placeholder="Select delivery deadline…"
          icon={<Calendar size={12} />}
          disabled={disabled}
          className={dealStageGateFieldClass(gateRequiredFields, 'deadline')}
          onValueChange={(v) => patchDraft({ deadline: v || null })}
        />
      )}
    </div>
  );
}
