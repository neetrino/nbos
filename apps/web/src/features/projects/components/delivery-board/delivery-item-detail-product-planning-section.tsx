'use client';

import { useMemo } from 'react';
import { Calendar, Layers, Package, Sparkles, Tag } from 'lucide-react';
import { InlineField } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
} from '@/features/projects/constants/projects';
import type { ProductPlanSnapshot } from './delivery-item-detail-planning-state';

export function ProductPlanningSection({
  product,
  draft,
  onDraftChange,
  disabled = false,
}: {
  product: FullProduct;
  draft: ProductPlanSnapshot;
  onDraftChange: (next: ProductPlanSnapshot) => void;
  disabled?: boolean;
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
    <section className="border-border bg-card/40 rounded-xl border p-4">
      <h3 className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-wider uppercase">
        Delivery plan
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
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
          onValueChange={(v) => patchDraft({ deadline: v })}
        />
        <InlineField
          variant="controlled"
          label="Category"
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
        <div className="md:col-span-2">
          <InlineField
            variant="controlled"
            label="Scope & working notes"
            type="textarea"
            value={draft.description}
            icon={<Sparkles size={12} />}
            placeholder="Plan, milestones, client context…"
            disabled={disabled}
            onValueChange={(v) => patchDraft({ description: v })}
          />
        </div>
      </div>
    </section>
  );
}
