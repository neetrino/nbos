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
import { productsApi } from '@/lib/api/products';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  PRODUCT_TYPES_BY_CATEGORY,
} from '@/features/projects/constants/projects';
import {
  type EmployeeSearchFn,
  useEmployeeSearchLoader,
} from './delivery-item-detail-employee-search';

function ProductPlanNameDeadlinePm({
  product,
  patchProduct,
  searchEmployees,
}: {
  product: FullProduct;
  patchProduct: (data: Parameters<typeof productsApi.update>[1]) => Promise<void>;
  searchEmployees: EmployeeSearchFn;
}) {
  return (
    <>
      <InlineField
        label="Product name"
        value={product.name}
        icon={<Package size={12} />}
        placeholder="Name…"
        onSave={(v) => void patchProduct({ name: v?.trim() || product.name })}
      />
      <InlineField
        label="Deadline"
        type="date"
        value={product.deadline ? product.deadline.slice(0, 10) : ''}
        displayValue={
          product.deadline ? (
            <span>{new Date(product.deadline).toLocaleDateString()}</span>
          ) : undefined
        }
        icon={<Calendar size={12} />}
        placeholder="Pick date…"
        clearable
        onSave={async (v) => {
          await patchProduct({ deadline: v && v.length > 0 ? v : null });
        }}
      />
      <SearchField
        label="Project manager"
        value={product.pmId}
        displayValue={
          product.pm ? (
            <span className="text-foreground font-medium">
              {product.pm.firstName} {product.pm.lastName}
            </span>
          ) : undefined
        }
        placeholder="Search people…"
        icon={<User size={12} />}
        onSearch={searchEmployees}
        onSave={async (id) => {
          await patchProduct({ pmId: id });
        }}
        onClear={async () => {
          await patchProduct({ pmId: null });
        }}
      />
    </>
  );
}

function ProductPlanCategoryType({
  product,
  typeOptions,
  patchProduct,
}: {
  product: FullProduct;
  typeOptions: Array<{ value: string; label: string }>;
  patchProduct: (data: Parameters<typeof productsApi.update>[1]) => Promise<void>;
}) {
  return (
    <>
      <InlineField
        label="Category"
        type="select"
        value={product.productCategory}
        options={PRODUCT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        icon={<Layers size={12} />}
        onSave={async (v) => {
          if (!v) return;
          const nextTypes = PRODUCT_TYPES_BY_CATEGORY[v] ?? [];
          const nextType = nextTypes.includes(product.productType)
            ? product.productType
            : (nextTypes[0] ?? product.productType);
          await patchProduct({ productCategory: v, productType: nextType });
        }}
      />
      <InlineField
        label="Product type"
        type="select"
        value={product.productType}
        options={typeOptions}
        icon={<Tag size={12} />}
        onSave={async (v) => {
          if (v) await patchProduct({ productType: v });
        }}
      />
    </>
  );
}

function ProductPlanNotesCompanyOrder({
  product,
  patchProduct,
}: {
  product: FullProduct;
  patchProduct: (data: Parameters<typeof productsApi.update>[1]) => Promise<void>;
}) {
  return (
    <>
      <div className="md:col-span-2">
        <InlineField
          label="Scope & working notes"
          type="textarea"
          value={product.description ?? ''}
          icon={<Sparkles size={12} />}
          placeholder="Plan, milestones, client context…"
          onSave={async (v) => {
            await patchProduct({ description: v });
          }}
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
    </>
  );
}

export function ProductPlanningSection({
  product,
  onSaved,
}: {
  product: FullProduct;
  onSaved: () => void;
}) {
  const searchEmployees = useEmployeeSearchLoader();
  const typeOptions = useMemo(() => {
    const allowed = PRODUCT_TYPES_BY_CATEGORY[product.productCategory] ?? [];
    const set = new Set(allowed);
    return PRODUCT_TYPES.filter((t) => set.size === 0 || set.has(t.value)).map((t) => ({
      value: t.value,
      label: t.label,
    }));
  }, [product.productCategory]);

  async function patchProduct(data: Parameters<typeof productsApi.update>[1]) {
    await productsApi.update(product.id, data);
    onSaved();
  }

  return (
    <section className="border-border bg-card/40 rounded-xl border p-5">
      <h3 className="text-muted-foreground mb-4 text-[11px] font-semibold tracking-wider uppercase">
        Delivery plan
      </h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <ProductPlanNameDeadlinePm
          product={product}
          patchProduct={patchProduct}
          searchEmployees={searchEmployees}
        />
        <ProductPlanCategoryType
          product={product}
          typeOptions={typeOptions}
          patchProduct={patchProduct}
        />
        <ProductPlanNotesCompanyOrder product={product} patchProduct={patchProduct} />
      </div>
    </section>
  );
}
