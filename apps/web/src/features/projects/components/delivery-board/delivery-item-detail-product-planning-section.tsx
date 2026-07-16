'use client';

import { useMemo } from 'react';
import { Calendar, ClipboardList, Layers, Package, Tag } from 'lucide-react';
import {
  DETAIL_SHEET_PANEL_DIVIDER_CLASS,
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

export function ProductPlanningSection({
  entityId,
  draft,
  onDraftChange,
  disabled = false,
  gateRequiredFields = new Set<string>(),
}: {
  entityId: string;
  draft: ProductPlanSnapshot;
  onDraftChange: (next: ProductPlanSnapshot) => void;
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

  return (
    <section className="border-border bg-card/40 w-full max-w-full min-w-0 rounded-xl border p-4">
      <h3 className="text-primary mb-4 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
        <ClipboardList size={13} aria-hidden />
        Delivery plan
      </h3>
      <div className="flex min-w-0 flex-col">
        <div className="min-w-0 space-y-3">
          <p className={DETAIL_SHEET_SUBSECTION_LABEL_CLASS}>Project</p>
          <InlineField
            variant="controlled"
            label="Product name"
            value={draft.name}
            icon={<Package size={12} />}
            placeholder="Name…"
            disabled={disabled}
            onValueChange={(v) => patchDraft({ name: v })}
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
        <div className={cn('mt-5 min-w-0 space-y-3', DETAIL_SHEET_PANEL_DIVIDER_CLASS)}>
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
    </section>
  );
}
