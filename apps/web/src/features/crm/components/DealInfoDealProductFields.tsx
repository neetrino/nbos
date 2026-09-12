'use client';

import { useTranslations } from 'next-intl';
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
import {
  translateDealTypeLabel,
  translateProductCategoryLabel,
  translateProductTypeLabel,
} from '../i18n/crm-copy';
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
  const t = useTranslations('crm');
  return (
    <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
      <InlineField
        variant="controlled"
        label={t('dealSheet.dealType')}
        type="select"
        value={draft.type}
        options={DEAL_TYPES.map((type) => ({
          value: type.value,
          label: translateDealTypeLabel(t, type.value),
        }))}
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
  const t = useTranslations('crm');
  const outsourceToggleDisabled = Boolean(disabled || outsourceToggleLocked);

  return (
    <>
      <InlineField
        variant="controlled"
        label={t('dealSheet.productCategory')}
        type="select"
        value={draft.productCategory ?? ''}
        options={PRODUCT_CATEGORIES.map((category) => ({
          value: category.value,
          label: translateProductCategoryLabel(t, category.value),
        }))}
        placeholder={t('dealSheet.selectCategory')}
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
          label={t('dealSheet.productType')}
          type="select"
          value={draft.productType ?? ''}
          options={filteredProductTypeOptions.map((option) => ({
            value: option.value,
            label: translateProductTypeLabel(t, option.value),
          }))}
          placeholder={t('dealSheet.selectProductType')}
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
  const t = useTranslations('crm');
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
          {t('dealSheet.outsourceToDelivery')}
        </Label>
        <p className="text-muted-foreground text-xs">{t('dealSheet.outsourceToDeliveryHint')}</p>
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
  const t = useTranslations('crm');

  return (
    <RelationPickerField
      label={t('common.entityProduct')}
      entityKind="product"
      value={draft.existingProductId}
      selectionLabel={draft.existingProductPickLabel}
      selectionSubtitle={draft.linkedProjectLabel}
      className={dealStageGateFieldClass(gateRequiredFields, 'existingProductId')}
      disabled={disabled}
      placeholder={t('dealSheet.searchProducts')}
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
  const t = useTranslations('crm');
  if (draft.type === 'MAINTENANCE') {
    return (
      <InlineField
        variant="controlled"
        label={t('dealSheet.plannedMaintenanceStart')}
        type="date"
        value={draft.maintenanceStartAt ?? ''}
        placeholder={t('dealSheet.selectStartDate')}
        icon={<Calendar size={12} />}
        disabled={disabled}
        onValueChange={(v) => patchDraft({ maintenanceStartAt: v || null })}
      />
    );
  }

  return (
    <InlineField
      variant="controlled"
      label={t('dealSheet.deadline')}
      type="date"
      datePickerVariant="extended"
      value={draft.deadline ?? ''}
      placeholder={t('dealSheet.selectDeadline')}
      icon={<Calendar size={12} />}
      disabled={disabled}
      className={dealStageGateFieldClass(gateRequiredFields, 'deadline')}
      onValueChange={(v) => patchDraft({ deadline: v || null })}
    />
  );
}
