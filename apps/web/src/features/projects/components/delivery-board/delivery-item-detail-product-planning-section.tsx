'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, ClipboardList, Layers, Tag, Wallet, AppWindow } from 'lucide-react';
import {
  DetailSheetCollapsibleSection,
  DetailSheetCollapsibleSubsection,
  EntityNotesField,
  InlineField,
} from '@/components/shared';
import { PRODUCT_CATEGORIES, PRODUCT_TYPES } from '@/features/projects/constants/projects';
import {
  allowedProductPlatforms,
  coerceOptionalProductPlatform,
  listedProductTypesForPicker,
  productPlatformPickerApplies,
  productTypeFieldReady,
} from '@nbos/shared';
import { cn } from '@/lib/utils';
import type { ProductPlanSnapshot } from './delivery-item-detail-planning-state';
import { deliveryStageGateFieldClass } from './delivery-stage-gate-highlight';
import { DeliveryItemLanguagesMultiselect } from './DeliveryItemLanguagesMultiselect';

/** Wider than the narrow field trigger so long type labels fit in the menu. */
const PRODUCT_TYPE_SELECT_MENU_CLASS = 'w-max min-w-[14rem] max-w-[min(20rem,calc(100vw-2rem))]';

export function ProductPlanningSection({
  entityId,
  draft,
  onDraftChange,
  paymentType,
  disabled = false,
  gateRequiredFields = new Set<string>(),
  stageChecklist,
}: {
  entityId: string;
  draft: ProductPlanSnapshot;
  onDraftChange: (next: ProductPlanSnapshot) => void;
  paymentType?: string | null;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
  /** Stage checklists trigger — sits beside Languages. */
  stageChecklist?: ReactNode;
}) {
  const t = useTranslations('deliveryBoard');
  const [sectionOpen, setSectionOpen] = useState(true);
  const typeOptions = useMemo(() => {
    const listed = listedProductTypesForPicker(draft.productCategory, draft.productType);
    const set = new Set(listed);
    return PRODUCT_TYPES.filter((item) => set.size === 0 || set.has(item.value)).map((item) => ({
      value: item.value,
      label: item.label,
    }));
  }, [draft.productCategory, draft.productType]);

  const patchDraft = (partial: Partial<ProductPlanSnapshot>) => {
    onDraftChange({ ...draft, ...partial });
  };

  const paymentLabel = paymentType?.replace(/_/g, ' ') ?? '—';

  return (
    <DetailSheetCollapsibleSection
      title={t('plan.deliveryTitle')}
      icon={<ClipboardList size={12} />}
      open={sectionOpen}
      onOpenChange={setSectionOpen}
      className="w-full max-w-full min-w-0 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <DetailSheetCollapsibleSubsection title={t('plan.project')}>
          <InlineField
            label={t('plan.payment')}
            value={paymentLabel}
            icon={<Wallet size={12} />}
            editable={false}
          />
          <InlineField
            variant="controlled"
            label={t('plan.deadline')}
            type="date"
            value={draft.deadline}
            icon={<Calendar size={12} />}
            placeholder={t('plan.pickDate')}
            clearable
            disabled={disabled}
            className={deliveryStageGateFieldClass(gateRequiredFields, 'deadline')}
            onValueChange={(v) => patchDraft({ deadline: v })}
          />
        </DetailSheetCollapsibleSubsection>
        <DetailSheetCollapsibleSubsection
          title={t('plan.product')}
          className={cn('border-border border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5')}
        >
          <InlineField
            variant="controlled"
            label={t('plan.productCategory')}
            type="select"
            value={draft.productCategory}
            options={PRODUCT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            icon={<Layers size={12} />}
            disabled={disabled}
            onValueChange={(v) => {
              if (!v) return;
              const allowed = listedProductTypesForPicker(v);
              const keepType = allowed.includes(draft.productType) ? draft.productType : '';
              const keepPlatform =
                v === 'CODE' && draft.productCategory === 'CODE' ? draft.productPlatform : null;
              onDraftChange({
                ...draft,
                productCategory: v,
                productType: keepType,
                productPlatform:
                  coerceOptionalProductPlatform({
                    productCategory: v,
                    productType: keepType || null,
                    requested: keepPlatform,
                  }) ?? '',
              });
            }}
          />
          {productPlatformPickerApplies(draft.productCategory) ? (
            <InlineField
              variant="controlled"
              label={t('plan.productPlatform')}
              type="select"
              value={draft.productPlatform}
              options={allowedProductPlatforms(draft.productCategory).map((value) => ({
                value,
                label: t(`plan.platforms.${value}`),
              }))}
              icon={<AppWindow size={12} />}
              disabled={disabled}
              onValueChange={(v) => {
                if (!v) return;
                const allowed = listedProductTypesForPicker(
                  draft.productCategory,
                  draft.productType,
                );
                patchDraft({
                  productPlatform:
                    coerceOptionalProductPlatform({
                      productCategory: draft.productCategory,
                      productType: draft.productType,
                      requested: v,
                    }) ?? '',
                  productType: allowed.includes(draft.productType) ? draft.productType : '',
                });
              }}
            />
          ) : null}
          {productTypeFieldReady({
            productCategory: draft.productCategory,
            productPlatform: draft.productPlatform,
          }) ? (
            <InlineField
              variant="controlled"
              label={t('plan.productType')}
              type="select"
              value={draft.productType}
              options={typeOptions}
              icon={<Tag size={12} />}
              disabled={disabled}
              selectContentClassName={PRODUCT_TYPE_SELECT_MENU_CLASS}
              onValueChange={(v) => {
                if (!v) return;
                patchDraft({
                  productType: v,
                  productPlatform:
                    coerceOptionalProductPlatform({
                      productCategory: draft.productCategory,
                      productType: v,
                      requested: v === 'MOBILE_APP' ? 'APP' : draft.productPlatform,
                    }) ?? '',
                });
              }}
            />
          ) : null}
        </DetailSheetCollapsibleSubsection>
      </div>
      <div
        className={cn('mt-3', deliveryStageGateFieldClass(gateRequiredFields, 'description', ''))}
      >
        <EntityNotesField
          entityType="generic"
          entityId={entityId}
          value={draft.description}
          onChange={(description) => patchDraft({ description: description ?? '' })}
          placeholder={t('plan.productNotesPlaceholder')}
          disabled={disabled}
        />
      </div>
      <div
        className={cn(
          'mt-3 grid grid-cols-1 gap-3',
          stageChecklist ? 'sm:grid-cols-2 sm:items-start' : undefined,
        )}
      >
        <DeliveryItemLanguagesMultiselect
          value={draft.languages}
          onChange={(languages) => patchDraft({ languages })}
          disabled={disabled}
        />
        {stageChecklist}
      </div>
    </DetailSheetCollapsibleSection>
  );
}
