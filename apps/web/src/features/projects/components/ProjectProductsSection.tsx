'use client';

import { useMemo } from 'react';
import { ArrowRight, Calendar, LayoutGrid, List, Package, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageHero,
  PageHeroTabs,
  StatusBadge,
  ViewModeSwitch,
  type ViewModeOption,
} from '@/components/shared';
import type { FullProject, ProjectProductSummary } from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getProductStatus,
  getProductType,
  PRODUCT_STATUSES,
} from '@/features/projects/constants/projects';
import {
  PROJECT_ENTITY_LIST_CLASS,
  PROJECT_ENTITY_LIST_ROW_CLASS,
  PROJECT_PRODUCTS_CARD_GRID_CLASS,
  type ProjectDetailViewMode,
} from './project-detail-layout.constants';

const PRODUCT_TAB_ALL = 'all';

const PRODUCT_VIEW_OPTIONS: ViewModeOption<ProjectDetailViewMode>[] = [
  {
    value: 'card',
    label: 'Cards',
    icon: <LayoutGrid className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'Card view',
  },
  {
    value: 'list',
    label: 'List',
    icon: <List className="size-3.5 shrink-0" aria-hidden />,
    ariaLabel: 'List view',
  },
];

interface ProjectProductsSectionProps {
  project: FullProject;
  products: ProjectProductSummary[];
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  viewMode: ProjectDetailViewMode;
  onViewModeChange: (mode: ProjectDetailViewMode) => void;
  onCreateProduct: () => void;
  onOpenProduct: (productId: string) => void;
}

export function ProjectProductsSection({
  project,
  products,
  statusFilter,
  setStatusFilter,
  viewMode,
  onViewModeChange,
  onCreateProduct,
  onOpenProduct,
}: ProjectProductsSectionProps) {
  const statusTabOptions = useMemo(() => {
    const byStatus = (status: string) =>
      project.products.filter((product) => product.status === status).length;
    const statusesWithProducts = PRODUCT_STATUSES.filter((status) => byStatus(status.value) > 0);

    return [
      { value: PRODUCT_TAB_ALL, label: `All Products (${project.products.length})` },
      ...statusesWithProducts.map((status) => ({
        value: status.value,
        label: `${status.label} (${byStatus(status.value)})`,
      })),
    ];
  }, [project.products]);

  const statusTab = statusFilter ?? PRODUCT_TAB_ALL;
  const hasProducts = project.products.length > 0;

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-hidden">
      <PageHero
        syncModuleTitle={false}
        className="mt-0"
        tabs={
          <PageHeroTabs
            value={statusTab}
            onChange={(value) => setStatusFilter(value === PRODUCT_TAB_ALL ? null : value)}
            options={statusTabOptions}
            ariaLabel="Product status"
          />
        }
        viewMode={
          hasProducts ? (
            <ViewModeSwitch
              value={viewMode}
              onChange={onViewModeChange}
              options={PRODUCT_VIEW_OPTIONS}
              ariaLabel="Products view mode"
            />
          ) : undefined
        }
        trailing={
          <Button size="sm" onClick={onCreateProduct} className="gap-1.5">
            <Plus size={14} aria-hidden />
            Product
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyProductsState
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onCreateProduct={onCreateProduct}
        />
      ) : viewMode === 'list' ? (
        <div className={PROJECT_ENTITY_LIST_CLASS}>
          {products.map((product) => (
            <ProductListRow key={product.id} product={product} onOpenProduct={onOpenProduct} />
          ))}
        </div>
      ) : (
        <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOpenProduct={onOpenProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyProductsState({
  statusFilter,
  setStatusFilter,
  onCreateProduct,
}: {
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  onCreateProduct: () => void;
}) {
  return (
    <div className="text-muted-foreground py-16 text-center">
      <Package size={48} className="mx-auto mb-4 opacity-20" />
      <p className="mb-1 text-sm font-medium">
        {statusFilter ? 'No products match this status filter' : 'No products in this project yet'}
      </p>
      <p className="mb-4 text-xs">
        {statusFilter
          ? 'Try another status or clear the filter.'
          : 'Create a product to start tracking work.'}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (statusFilter ? setStatusFilter(null) : onCreateProduct())}
        className="gap-1.5"
      >
        <Plus size={14} />
        {statusFilter ? 'Show All Products' : 'Create First Product'}
      </Button>
    </div>
  );
}

function ProductListRow({
  product,
  onOpenProduct,
}: {
  product: ProjectProductSummary;
  onOpenProduct: (productId: string) => void;
}) {
  const status = getProductStatus(product.status);
  const productType = getProductType(product.productType);
  const statusLabel = product.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(product.deliveryLifecycle)
    : status?.label;

  return (
    <button
      type="button"
      onClick={() => onOpenProduct(product.id)}
      className={PROJECT_ENTITY_LIST_ROW_CLASS}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{product.name}</span>
          {productType && (
            <span className="text-muted-foreground text-xs">{productType.label}</span>
          )}
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {product.pm && (
            <span className="inline-flex items-center gap-1">
              <User size={11} aria-hidden />
              {product.pm.firstName} {product.pm.lastName}
            </span>
          )}
          {product.deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} aria-hidden />
              {new Date(product.deadline).toLocaleDateString()}
            </span>
          )}
          <span>
            {product._count.tasks} tasks · {product._count.extensions} ext. ·{' '}
            {product._count.tickets} tickets
          </span>
        </div>
      </div>
      {status && statusLabel && (
        <StatusBadge label={statusLabel} variant={status.variant} className="shrink-0" />
      )}
    </button>
  );
}

function ProductCard({
  product,
  onOpenProduct,
}: {
  product: ProjectProductSummary;
  onOpenProduct: (productId: string) => void;
}) {
  const status = getProductStatus(product.status);
  const productType = getProductType(product.productType);
  const statusLabel = product.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(product.deliveryLifecycle)
    : status?.label;

  return (
    <div
      onClick={() => onOpenProduct(product.id)}
      className="bg-card border-border hover:border-accent/50 group flex h-full min-h-36 min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border p-4 transition-colors"
    >
      <div className="min-w-0 shrink-0">
        <h4 className="truncate text-sm font-semibold">{product.name}</h4>
        {productType && <span className="text-muted-foreground text-xs">{productType.label}</span>}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-1.5">
        {product.pm && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={12} />
            <span className="truncate">
              {product.pm.firstName} {product.pm.lastName}
            </span>
          </div>
        )}
        {product.deadline && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Calendar size={12} />
            <span>{new Date(product.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        <div className="text-muted-foreground flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-[10px]">
          <span>{product._count.tasks} tasks</span>
          <span>{product._count.extensions} ext.</span>
          <span>{product._count.tickets} tickets</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          {status && statusLabel && (
            <StatusBadge
              label={statusLabel}
              variant={status.variant}
              className="max-w-full min-w-0 shrink truncate"
              title={statusLabel}
            />
          )}
          <ArrowRight
            size={14}
            className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
