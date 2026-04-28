'use client';

import { ArrowRight, Calendar, Package, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type { FullProject, ProjectProductSummary } from '@/lib/api/projects';
import {
  getProductStatus,
  getProductType,
  PRODUCT_STATUSES,
} from '@/features/projects/constants/projects';

interface ProjectProductsSectionProps {
  project: FullProject;
  products: ProjectProductSummary[];
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  onCreateProduct: () => void;
  onOpenProduct: (productId: string) => void;
}

export function ProjectProductsSection({
  project,
  products,
  statusFilter,
  setStatusFilter,
  onCreateProduct,
  onOpenProduct,
}: ProjectProductsSectionProps) {
  const byStatus = (status: string) =>
    project.products.filter((product) => product.status === status).length;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Products</h2>
          <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {products.length}
          </span>
          {products.length > 0 && (
            <ProductStatusFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              byStatus={byStatus}
            />
          )}
        </div>
        <Button size="sm" onClick={onCreateProduct} className="gap-1.5">
          <Plus size={14} />
          New Product
        </Button>
      </div>

      {products.length === 0 ? (
        <EmptyProductsState
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onCreateProduct={onCreateProduct}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOpenProduct={onOpenProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductStatusFilters({
  statusFilter,
  setStatusFilter,
  byStatus,
}: {
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  byStatus: (status: string) => number;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant={statusFilter === null ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => setStatusFilter(null)}
        className="h-7 text-xs"
      >
        All
      </Button>
      {PRODUCT_STATUSES.filter((status) => byStatus(status.value) > 0).map((status) => (
        <Button
          key={status.value}
          variant={statusFilter === status.value ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setStatusFilter(status.value)}
          className="h-7 text-xs"
        >
          {status.label} ({byStatus(status.value)})
        </Button>
      ))}
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

function ProductCard({
  product,
  onOpenProduct,
}: {
  product: ProjectProductSummary;
  onOpenProduct: (productId: string) => void;
}) {
  const status = getProductStatus(product.status);
  const productType = getProductType(product.productType);

  return (
    <div
      onClick={() => onOpenProduct(product.id)}
      className="bg-card border-border hover:border-accent/50 group cursor-pointer rounded-xl border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold">{product.name}</h4>
          {productType && (
            <span className="text-muted-foreground text-xs">{productType.label}</span>
          )}
        </div>
        {status && <StatusBadge label={status.label} variant={status.variant} />}
      </div>

      <div className="mt-3 space-y-1.5">
        {product.pm && (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={12} />
            <span>
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

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-[10px]">
          <span className="text-muted-foreground">{product._count.tasks} tasks</span>
          <span className="text-muted-foreground">{product._count.extensions} ext.</span>
          <span className="text-muted-foreground">{product._count.tickets} tickets</span>
        </div>
        <ArrowRight
          size={14}
          className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </div>
  );
}
