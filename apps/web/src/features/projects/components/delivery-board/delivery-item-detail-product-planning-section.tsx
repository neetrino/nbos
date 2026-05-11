'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import type { FullProduct, UpdateProductData } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
} from '@/features/projects/constants/projects';
import { useEmployeeSearchLoader } from './delivery-item-detail-employee-search';

type ProductPlanSnapshot = {
  name: string;
  deadline: string;
  pmId: string | null;
  pmLabel: string;
  productCategory: string;
  productType: string;
  description: string;
};

function snapshotFromProduct(p: FullProduct): ProductPlanSnapshot {
  return {
    name: p.name,
    deadline: p.deadline ? p.deadline.slice(0, 10) : '',
    pmId: p.pmId,
    pmLabel: p.pm ? `${p.pm.firstName} ${p.pm.lastName}` : '',
    productCategory: p.productCategory,
    productType: p.productType,
    description: p.description ?? '',
  };
}

function buildProductPatch(
  snap: ProductPlanSnapshot,
  draft: ProductPlanSnapshot,
): UpdateProductData | null {
  const patch: UpdateProductData = {};

  const resolvedName = draft.name.trim() || snap.name;
  if (resolvedName !== snap.name) {
    patch.name = resolvedName;
  }

  const draftDeadline = draft.deadline.trim() ? draft.deadline : null;
  const snapDeadline = snap.deadline.trim() ? snap.deadline : null;
  if (draftDeadline !== snapDeadline) {
    patch.deadline = draftDeadline;
  }

  if (draft.pmId !== snap.pmId) {
    patch.pmId = draft.pmId;
  }

  if (draft.productCategory !== snap.productCategory) {
    patch.productCategory = draft.productCategory;
    const allowed = PRODUCT_TYPES_BY_CATEGORY[draft.productCategory] ?? [];
    patch.productType = allowed.includes(draft.productType)
      ? draft.productType
      : (allowed[0] ?? draft.productType);
  } else if (draft.productType !== snap.productType) {
    patch.productType = draft.productType;
  }

  const nextDesc = draft.description;
  if (nextDesc !== snap.description) {
    patch.description = nextDesc.trim() ? nextDesc : null;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function ProductPlanningSection({
  product,
  onSaved,
}: {
  product: FullProduct;
  onSaved: () => void;
}) {
  const searchEmployees = useEmployeeSearchLoader();
  const [snap, setSnap] = useState<ProductPlanSnapshot>(() => snapshotFromProduct(product));
  const [draft, setDraft] = useState<ProductPlanSnapshot>(() => snapshotFromProduct(product));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = snapshotFromProduct(product);
    setSnap(next);
    setDraft(next);
  }, [product.id, product.updatedAt]);

  const typeOptions = useMemo(() => {
    const allowed = PRODUCT_TYPES_BY_CATEGORY[draft.productCategory] ?? [];
    const set = new Set(allowed);
    return PRODUCT_TYPES.filter((t) => set.size === 0 || set.has(t.value)).map((t) => ({
      value: t.value,
      label: t.label,
    }));
  }, [draft.productCategory]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(snap), [draft, snap]);

  const handleCancel = useCallback(() => {
    setDraft(snap);
  }, [snap]);

  const handleSave = useCallback(async () => {
    const patch = buildProductPatch(snap, draft);
    if (!patch) return;
    setSaving(true);
    try {
      await productsApi.update(product.id, patch);
      onSaved();
    } finally {
      setSaving(false);
    }
  }, [snap, draft, product.id, onSaved]);

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
          disabled={saving}
          onValueChange={(v) => setDraft((d) => ({ ...d, name: v }))}
        />
        <InlineField
          variant="controlled"
          label="Deadline"
          type="date"
          value={draft.deadline}
          icon={<Calendar size={12} />}
          placeholder="Pick date…"
          clearable
          disabled={saving}
          onValueChange={(v) => setDraft((d) => ({ ...d, deadline: v }))}
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
            setDraft((d) => ({ ...d, pmId: id, pmLabel: label }));
          }}
          onClear={() => {
            setDraft((d) => ({ ...d, pmId: null, pmLabel: '' }));
          }}
        />
        <InlineField
          variant="controlled"
          label="Category"
          type="select"
          value={draft.productCategory}
          options={PRODUCT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          icon={<Layers size={12} />}
          disabled={saving}
          onValueChange={(v) => {
            if (!v) return;
            setDraft((d) => {
              const allowed = PRODUCT_TYPES_BY_CATEGORY[v] ?? [];
              const nextType = allowed.includes(d.productType)
                ? d.productType
                : (allowed[0] ?? d.productType);
              return { ...d, productCategory: v, productType: nextType };
            });
          }}
        />
        <InlineField
          variant="controlled"
          label="Product type"
          type="select"
          value={draft.productType}
          options={typeOptions}
          icon={<Tag size={12} />}
          disabled={saving}
          onValueChange={(v) => {
            if (v) setDraft((d) => ({ ...d, productType: v }));
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
            disabled={saving}
            onValueChange={(v) => setDraft((d) => ({ ...d, description: v }))}
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
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || saving}
          onClick={() => void handleSave()}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dirty || saving}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}
