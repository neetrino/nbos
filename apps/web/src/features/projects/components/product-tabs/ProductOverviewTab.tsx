'use client';

import { DollarSign, ListChecks, Puzzle, Ticket } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import { getProductStatus, getProductType } from '@/features/projects/constants/projects';
import { ProductStageGateCard } from './ProductStageGateCard';

interface ProductOverviewTabProps {
  product: FullProduct;
  onStatusChange: () => void;
}

export function ProductOverviewTab({ product, onStatusChange }: ProductOverviewTabProps) {
  const doneTasks = product.tasks.filter((task) => task.status === 'DONE').length;
  const doneExtensions = product.extensions.filter(
    (extension) => extension.status === 'DONE',
  ).length;

  return (
    <div className="space-y-6">
      <ProductStats product={product} doneTasks={doneTasks} doneExtensions={doneExtensions} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductDetailsCard product={product} />
        <ProductStageGateCard product={product} onStatusChange={onStatusChange} />
      </div>
      {product.description && <ProductDescriptionCard description={product.description} />}
    </div>
  );
}

function ProductStats({
  product,
  doneTasks,
  doneExtensions,
}: {
  product: FullProduct;
  doneTasks: number;
  doneExtensions: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={ListChecks}
        label="Tasks"
        value={`${doneTasks}/${product.tasks.length}`}
        color="bg-blue-500"
      />
      <StatCard
        icon={Puzzle}
        label="Extensions"
        value={`${doneExtensions}/${product.extensions.length}`}
        color="bg-purple-500"
      />
      <StatCard icon={Ticket} label="Tickets" value={product.tickets.length} color="bg-amber-500" />
      <StatCard
        icon={DollarSign}
        label="Order"
        value={
          product.order
            ? `${Number(product.order.totalAmount).toLocaleString()} ${product.order.currency}`
            : '-'
        }
        color="bg-emerald-500"
      />
    </div>
  );
}

function ProductDetailsCard({ product }: { product: FullProduct }) {
  const status = getProductStatus(product.status);
  const productType = getProductType(product.productType);

  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 text-sm font-semibold">Product Details</h3>
      <div className="space-y-3 text-sm">
        <DetailRow label="Type" value={productType?.label} />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          {status && <StatusBadge label={status.label} variant={status.variant} />}
        </div>
        {product.pm && (
          <DetailRow label="PM" value={`${product.pm.firstName} ${product.pm.lastName}`} />
        )}
        {product.deadline && (
          <DetailRow label="Deadline" value={new Date(product.deadline).toLocaleDateString()} />
        )}
        <DetailRow label="Project" value={product.project.name} />
        <DetailRow label="Created" value={new Date(product.createdAt).toLocaleDateString()} />
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ProductDescriptionCard({ description }: { description: string }) {
  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-2 text-sm font-semibold">Description</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </section>
  );
}
