'use client';

import { useMemo } from 'react';
import { Calendar, ClipboardList, Layers, Tag, Wallet } from 'lucide-react';
import {
  DETAIL_SHEET_SECTION_TITLE_CLASS,
  DETAIL_SHEET_SUBSECTION_LABEL_CLASS,
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
}: {
  entityId: string;
  draft: ProductPlanSnapshot;
  onDraftChange: (next: ProductPlanSnapshot) => void;
  paymentType?: string | null;
  disabled?: boolean;
  gateRequiredFields?: ReadonlySet<string>;
}) {
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
    <section className="border-border bg-card w-full max-w-full min-w-0 rounded-xl border p-4 shadow-sm">
      <h3 className={cn(DETAIL_SHEET_SECTION_TITLE_CLASS, 'mb-3')}>
        <ClipboardList size={13} aria-hidden />
        Delivery plan
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="min-w-0 space-y-3">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Project</p>
          <InlineField
            variant="controlled"
            label="Payment"
            value={paymentLabel}
            icon={<Wallet size={12} />}
            disabled
          />
          <InlineField
            variant="controlled"
            label="Deadline"
            type="date"
            value={draft.deadline}
            icon={<Calendar size={12} />}
            placeholder="Pick date…"
            clearable
            disabled={disabled}
            className={deliveryStageGateFieldClass(gateRequiredFields, 'deadline')}
            onValueChange={(v) => patchDraft({ deadline: v })}
          />
        </div>
        <div className="border-border min-w-0 space-y-3 border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Product</p>
          <InlineField
            variant="controlled"
            label="Product category"
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
            label="Product type"
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
        </div>
      </div>
      <div
        className={cn('mt-3', deliveryStageGateFieldClass(gateRequiredFields, 'description', ''))}
      >
        <EntityNotesField
          entityType="generic"
          entityId={entityId}
          value={draft.description}
          onChange={(description) => patchDraft({ description: description ?? '' })}
          placeholder="Plan, milestones, client context…"
          disabled={disabled}
        />
      </div>
      <div className="mt-3">
        <DeliveryItemLanguagesMultiselect
          value={draft.languages}
          onChange={(languages) => patchDraft({ languages })}
          disabled={disabled}
        />
      </div>
    </section>
  );
}
