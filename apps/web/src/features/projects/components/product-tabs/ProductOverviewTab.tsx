'use client';

import { useCallback, useMemo, useState } from 'react';
import { DollarSign, ListChecks, Puzzle, Ticket } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
  getProductStatus,
  getProductType,
} from '@/features/projects/constants/projects';
import {
  buildProductGateRequiredFields,
  productStageGateFieldClass,
  resolveProductTabFromGateErrors,
  type ProductTabForGate,
} from '@/features/projects/product-stage-gate-highlight';
import type { SheetStageGateHighlight } from '@/lib/stage-gate-highlight';
import type { ApiFieldError } from '@/lib/api-errors';
import { DeliveryStageTimelineCard } from './DeliveryStageTimelineCard';
import { ProductStageGateCard } from './ProductStageGateCard';
import { ProductParticipantsSection } from '@/features/platform-access/components/ProductParticipantsSection';

interface ProductOverviewTabProps {
  product: FullProduct;
  onStatusChange: () => void;
  onNavigateTab: (tab: ProductTabForGate) => void;
}

export function ProductOverviewTab({
  product,
  onStatusChange,
  onNavigateTab,
}: ProductOverviewTabProps) {
  const [stageGateHighlight, setStageGateHighlight] = useState<SheetStageGateHighlight | null>(
    null,
  );

  const gateRequiredFields = useMemo(
    () =>
      stageGateHighlight
        ? buildProductGateRequiredFields(stageGateHighlight.errors)
        : new Set<string>(),
    [stageGateHighlight],
  );

  const showStageGateRequirements = useCallback(
    (errors: ApiFieldError[]) => {
      setStageGateHighlight({ errors });
      const tab = resolveProductTabFromGateErrors(errors);
      if (tab !== 'overview') onNavigateTab(tab);
    },
    [onNavigateTab],
  );

  const doneTasks = product.tasks.filter((task) => task.status === 'DONE').length;
  const doneExtensions = product.extensions.filter(
    (extension) => extension.status === 'DONE',
  ).length;

  return (
    <div className="space-y-6">
      <ProductStats product={product} doneTasks={doneTasks} doneExtensions={doneExtensions} />
      <ProductDeliveryLifecycleCard product={product} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductDetailsCard product={product} gateRequiredFields={gateRequiredFields} />
        <ProductStageGateCard
          product={product}
          gateRequiredFields={gateRequiredFields}
          stageGateHighlight={stageGateHighlight}
          onStatusChange={onStatusChange}
          onStageGateBlocked={showStageGateRequirements}
          onStageGateClear={() => setStageGateHighlight(null)}
          onNavigateTab={onNavigateTab}
        />
      </div>
      <ProductDescriptionCard
        description={product.description}
        gateRequiredFields={gateRequiredFields}
        forceVisible={gateRequiredFields.has('description')}
      />
      <ProductParticipantsSection productId={product.id} />
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

function ProductDetailsCard({
  product,
  gateRequiredFields,
}: {
  product: FullProduct;
  gateRequiredFields: ReadonlySet<string>;
}) {
  const status = getProductStatus(product.status);
  const productType = getProductType(product.productType);
  const lifecycle = product.deliveryLifecycle;

  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 text-sm font-semibold">Product Details</h3>
      <div className="space-y-3 text-sm">
        <DetailRow label="Type" value={productType?.label} />
        {lifecycle ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <StatusBadge
              label={formatDeliveryLifecycleLabel(lifecycle)}
              variant={getDeliveryLifecycleVariant(lifecycle)}
            />
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            {status && <StatusBadge label={status.label} variant={status.variant} />}
          </div>
        )}
        {product.pm && (
          <DetailRow label="PM" value={`${product.pm.firstName} ${product.pm.lastName}`} />
        )}
        <div
          className={productStageGateFieldClass(
            gateRequiredFields,
            'deadline',
            'flex justify-between rounded-md px-1 py-0.5',
          )}
        >
          <span className="text-muted-foreground">Deadline</span>
          <span className="font-medium">
            {product.deadline ? new Date(product.deadline).toLocaleDateString() : '—'}
          </span>
        </div>
        <div
          className={productStageGateFieldClass(
            gateRequiredFields,
            'order',
            'flex justify-between rounded-md px-1 py-0.5',
          )}
        >
          <span className="text-muted-foreground">Order</span>
          <span className="font-medium">{product.order ? 'Linked' : '—'}</span>
        </div>
        <DetailRow label="Project" value={product.project.name} />
        <DetailRow label="Created" value={new Date(product.createdAt).toLocaleDateString()} />
      </div>
    </section>
  );
}

function ProductDeliveryLifecycleCard({ product }: { product: FullProduct }) {
  const lifecycle = product.deliveryLifecycle;
  if (!lifecycle) return null;

  return (
    <DeliveryStageTimelineCard
      lifecycle={lifecycle}
      title="Delivery Lifecycle"
      description="Product delivery source of truth for stage, pause state and terminal outcome."
      showLifecycleBadge
    />
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

function ProductDescriptionCard({
  description,
  gateRequiredFields,
  forceVisible,
}: {
  description: string | null;
  gateRequiredFields: ReadonlySet<string>;
  forceVisible: boolean;
}) {
  if (!description && !forceVisible) return null;

  return (
    <section
      className={productStageGateFieldClass(
        gateRequiredFields,
        'description',
        'bg-card border-border rounded-xl border p-5',
      )}
    >
      <h3 className="mb-2 text-sm font-semibold">Description</h3>
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      ) : (
        <p className="text-muted-foreground text-sm">Description is required before Creating.</p>
      )}
    </section>
  );
}
