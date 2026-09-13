'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, ClipboardList, Layers, Tag, Wallet } from 'lucide-react';
import {
  DetailSheetCollapsibleSection,
  DetailSheetCollapsibleSubsection,
  EntityNotesField,
  InlineField,
} from '@/components/shared';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
} from '@/features/projects/constants/projects';
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
    const allowed = PRODUCT_TYPES_BY_CATEGORY[draft.productCategory] ?? [];
    const set = new Set(allowed);
    return PRODUCT_TYPES.filter((t) => set.size === 0 || set.has(t.value)).map((t) => ({
      value: t.value,
      label: t.label,
    }));
  }, [draft.productCategory]);

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
              const allowed = PRODUCT_TYPES_BY_CATEGORY[v] ?? [];
              const nextType = allowed.includes(draft.productType)
                ? draft.productType
                : (allowed[0] ?? draft.productType);
              onDraftChange({ ...draft, productCategory: v, productType: nextType });
            }}
          />
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
              if (v) patchDraft({ productType: v });
            }}
          />
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
