'use client';

import { useMemo } from 'react';
import { Calendar, LayoutGrid, List, Package, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  EntityLinkedSheetsHoverActions,
  NAVIGABLE_ENTITY_CARD_GRID_CLASS,
  PageHero,
  PageHeroTabs,
  ProductNavigableCard,
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
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';
import {
  PROJECT_ENTITY_LIST_CLASS,
  PROJECT_ENTITY_LIST_ROW_CLASS,
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
}

export function ProjectProductsSection({
  project,
  products,
  statusFilter,
  setStatusFilter,
  viewMode,
  onViewModeChange,
  onCreateProduct,
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
    <div className="w-full min-w-0 space-y-4">
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
            <ProductListRow key={product.id} projectId={project.id} product={product} />
          ))}
        </div>
      ) : (
        <div className={NAVIGABLE_ENTITY_CARD_GRID_CLASS}>
          {products.map((product) => (
            <ProductNavigableCard key={product.id} projectId={project.id} product={product} />
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
  projectId,
  product,
}: {
  projectId: string;
  product: ProjectProductSummary;
}) {
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const dealId = getEntityOrderDealId(product.order);
  const status = getProductStatus(product.status);
  const productType = getProductType(product.productType);
  const statusLabel = product.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(product.deliveryLifecycle)
    : status?.label;

  return (
    <div className={`${PROJECT_ENTITY_LIST_ROW_CLASS} group/entity-row`}>
      <a
        href={`/projects/${projectId}/products/${product.id}`}
        className="min-w-0 flex-1 text-left"
      >
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
      </a>
      {status && statusLabel && (
        <StatusBadge label={statusLabel} variant={status.variant} className="shrink-0" />
      )}
      <EntityLinkedSheetsHoverActions
        variant="row"
        contextHref={`/projects/${projectId}`}
        onOpenDelivery={() => openDeliveryItem(`product-${product.id}`)}
        onOpenDeal={dealId ? () => openDeal(dealId) : undefined}
      />
    </div>
  );
}
