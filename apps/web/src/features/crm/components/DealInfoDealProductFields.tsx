'use client';

import { Calendar, Layers, Tag } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  InlineField,
  RelationPickerField,
} from '@/components/shared';
import { useRelationPickerActions } from '@/components/shared/relation-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DEAL_TYPES, PRODUCT_CATEGORIES } from '../constants/dealPipeline';
import { dealStageGateFieldClass } from '@/features/crm/deal-stage-gate-highlight';
import { buildDealExistingProductSelectPatch } from './deal-existing-product-search';
import {
  buildDealExistingProductChangePatch,
  buildDealTypeChangePatch,
  isLinkedProductDealType,
  isProductLikeDealType,
  type DealGeneralDraft,
} from './deal-general-form-state';
import type { SearchLoader } from './deal-general-tab.types';

interface DealInfoDealProductFieldsProps {
  draft: DealGeneralDraft;
  patchDraft: (partial: Partial<DealGeneralDraft>) => void;
  filteredProductTypeOptions: Array<{ value: string; label: string }>;
  searchProducts: SearchLoader;
  disabled?: boolean;
  outsourceToggleLocked?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}

/** Right column: deal type, then category/type or product, then dates. */
export function DealInfoDealProductFields({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  searchProducts,
  disabled = false,
  outsourceToggleLocked = false,
  gateRequiredFields = new Set(),
}: DealInfoDealProductFieldsProps) {
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
        className={dealStageGateFieldClass(gateRequiredFields, 'type')}
        onValueChange={(v) => {
          if (v) patchDraft(buildDealTypeChangePatch(draft, v));
        }}
      />

      {isProductLikeDealType(draft.type) ? (
        <DealInfoProductTaxonomyFields
          draft={draft}
          patchDraft={patchDraft}
          filteredProductTypeOptions={filteredProductTypeOptions}
          disabled={disabled}
          outsourceToggleLocked={outsourceToggleLocked}
          gateRequiredFields={gateRequiredFields}
        />
      ) : null}

      {isLinkedProductDealType(draft.type) ? (
        <DealInfoExistingProductField
          draft={draft}
          patchDraft={patchDraft}
          searchProducts={searchProducts}
          disabled={disabled}
          gateRequiredFields={gateRequiredFields}
        />
      ) : null}

      <DealInfoScheduleFields
        draft={draft}
        patchDraft={patchDraft}
        disabled={disabled}
        gateRequiredFields={gateRequiredFields}
      />
    </div>
  );
}

function DealInfoProductTaxonomyFields({
  draft,
  patchDraft,
  filteredProductTypeOptions,
  disabled = false,
  outsourceToggleLocked = false,
  gateRequiredFields = new Set(),
}: Omit<DealInfoDealProductFieldsProps, 'searchProducts'>) {
  const outsourceToggleDisabled = Boolean(disabled || outsourceToggleLocked);

  return (
    <>
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

      {draft.productCategory ? (
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
      ) : null}

      {draft.type === 'OUTSOURCE' ? (
        <DealInfoOutsourceToggle
          checked={draft.outsourceGoesToDelivery}
          disabled={outsourceToggleDisabled}
          onCheckedChange={(checked) => patchDraft({ outsourceGoesToDelivery: checked })}
        />
      ) : null}
    </>
  );
}

function DealInfoOutsourceToggle({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2 pt-1">
      <Checkbox
        id="deal-outsource-goes-to-delivery"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <div className="min-w-0">
        <Label htmlFor="deal-outsource-goes-to-delivery" className="text-sm font-medium">
          Goes to Delivery Board
        </Label>
        <p className="text-muted-foreground text-xs">
          OFF (default): Product in Hub / Finance / WhatsApp without active Starting…Transfer. ON:
          full delivery lifecycle after Won. Locked after Won.
        </p>
      </div>
    </div>
  );
}

function DealInfoExistingProductField({
  draft,
  patchDraft,
  searchProducts,
  disabled = false,
  gateRequiredFields = new Set(),
}: Pick<
  DealInfoDealProductFieldsProps,
  'draft' | 'patchDraft' | 'searchProducts' | 'disabled' | 'gateRequiredFields'
>) {
  const productPicker = useRelationPickerActions(
    'product',
    'deal-existing-product',
    draft.projectId ? { projectId: draft.projectId } : undefined,
  );

  return (
    <RelationPickerField
      label="Product"
      entityKind="product"
      value={draft.existingProductId}
      selectionLabel={draft.existingProductPickLabel}
      selectionSubtitle={draft.linkedProjectLabel}
      className={dealStageGateFieldClass(gateRequiredFields, 'existingProductId')}
      disabled={disabled}
      placeholder="Search products…"
      icon={<Layers size={12} />}
      onSearch={searchProducts}
      onSelect={(id, label) => {
        void buildDealExistingProductSelectPatch(id, label).then(patchDraft);
      }}
      onClear={() => patchDraft(buildDealExistingProductChangePatch(null, null, null, null))}
      onOpenSelected={productPicker.onOpenSelected}
      {...(draft.projectId ? { onCreate: productPicker.onCreate } : {})}
    />
  );
}

function DealInfoScheduleFields({
  draft,
  patchDraft,
  disabled = false,
  gateRequiredFields = new Set(),
}: Pick<
  DealInfoDealProductFieldsProps,
  'draft' | 'patchDraft' | 'disabled' | 'gateRequiredFields'
>) {
  if (draft.type === 'MAINTENANCE') {
    return (
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
    );
  }

  return (
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
  );
}
