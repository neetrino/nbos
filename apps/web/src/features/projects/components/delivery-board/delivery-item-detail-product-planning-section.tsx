'use client';

import { useMemo } from 'react';
import {
  Building2,
  Calendar,
  FolderKanban,
  Layers,
  Package,
  Sparkles,
  Tag,
  User,
} from 'lucide-react';
import { InlineField, SearchField } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
} from '@/features/projects/constants/projects';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';
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
  const searchEmployees = useEmployeeSearchLoader();

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
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-4 text-[11px] font-semibold tracking-wider uppercase">
        Delivery plan
      </h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
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
        <SearchField
          selectionMode="stage"
          label="Project manager"
          value={draft.pmId}
          displayValue={
            draft.pmLabel ? (
              <span className="text-foreground font-medium">{draft.pmLabel}</span>
            ) : undefined
          }
          placeholder="Search people…"
          icon={<User size={12} />}
          onSearch={searchEmployees}
          onStageSelect={(id, label) => {
            patchDraft({ pmId: id, pmLabel: label });
          }}
          onClear={() => {
            patchDraft({ pmId: null, pmLabel: '' });
          }}
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
        {product.project.company ? (
          <div className="text-muted-foreground flex items-start gap-2 text-sm md:col-span-2">
            <Building2 size={14} className="mt-0.5 shrink-0 opacity-70" />
            <span>
              <span className="text-foreground font-medium">Company: </span>
              {product.project.company.name}
            </span>
          </div>
        ) : null}
        {product.order ? (
          <div className="text-muted-foreground flex items-start gap-2 text-sm md:col-span-2">
            <FolderKanban size={14} className="mt-0.5 shrink-0 opacity-70" />
            <span>
              <span className="text-foreground font-medium">Order: </span>
              {product.order.code}
              {product.order.deal?.code ? ` · Deal ${product.order.deal.code}` : ''}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
