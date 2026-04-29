'use client';

import { DollarSign, ListChecks, Puzzle, Ticket } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import {
  formatDeliveryLifecycleLabel,
  formatDeliveryHoldUntil,
  getDeliveryLifecycleVariant,
  getProductStatus,
  getProductType,
  isDeliveryHoldExpired,
} from '@/features/projects/constants/projects';
import { ProductStageGateCard } from './ProductStageGateCard';

const DELIVERY_STAGES = [
  { value: 'STARTING', label: 'Starting' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'QA', label: 'QA' },
  { value: 'TRANSFER', label: 'Transfer' },
] as const;

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
      <ProductDeliveryLifecycleCard product={product} />
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
        {product.deadline && (
          <DetailRow label="Deadline" value={new Date(product.deadline).toLocaleDateString()} />
        )}
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
    <section className="bg-card border-border rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Delivery Lifecycle</h3>
          <p className="text-muted-foreground text-xs">
            Product delivery source of truth for stage, pause state and terminal outcome.
          </p>
        </div>
        <StatusBadge
          label={formatDeliveryLifecycleLabel(lifecycle)}
          variant={getDeliveryLifecycleVariant(lifecycle)}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {DELIVERY_STAGES.map((stage) => (
          <DeliveryStageStep key={stage.value} stage={stage} lifecycle={lifecycle} />
        ))}
      </div>
      {lifecycle.workStatus === 'ON_HOLD' && <HoldStateCopy lifecycle={lifecycle} />}
    </section>
  );
}

function HoldStateCopy({
  lifecycle,
}: {
  lifecycle: NonNullable<FullProduct['deliveryLifecycle']>;
}) {
  const date = formatDeliveryHoldUntil(lifecycle.onHoldUntil);
  const expired = isDeliveryHoldExpired(lifecycle);
  const dateCopy = date ? ` until ${date}` : '';
  const copy = expired
    ? `Delivery hold expired${date ? ` on ${date}` : ''}. Resume or update the delivery pause.`
    : `Delivery is paused${dateCopy}. Resume delivery when work can continue.`;

  return (
    <p
      className={`mt-3 text-xs ${expired ? 'font-medium text-amber-600' : 'text-muted-foreground'}`}
    >
      {copy}
    </p>
  );
}

function DeliveryStageStep({
  stage,
  lifecycle,
}: {
  stage: (typeof DELIVERY_STAGES)[number];
  lifecycle: NonNullable<FullProduct['deliveryLifecycle']>;
}) {
  const currentIndex = DELIVERY_STAGES.findIndex((item) => item.value === lifecycle.stage);
  const stageIndex = DELIVERY_STAGES.findIndex((item) => item.value === stage.value);
  const isCurrent = lifecycle.stage === stage.value && !lifecycle.resolution;
  const isDone =
    lifecycle.resolution === 'DONE' || (currentIndex >= 0 && stageIndex < currentIndex);
  const stateClassName = getStageStepClassName({ isCurrent, isDone, lifecycle });

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${stateClassName}`}>
      {stage.label}
    </div>
  );
}

function getStageStepClassName({
  isCurrent,
  isDone,
  lifecycle,
}: {
  isCurrent: boolean;
  isDone: boolean;
  lifecycle: NonNullable<FullProduct['deliveryLifecycle']>;
}) {
  if (lifecycle.resolution === 'CANCELLED') return 'border-red-200 bg-red-50 text-red-700';
  if (isCurrent && lifecycle.workStatus === 'ON_HOLD') {
    if (isDeliveryHoldExpired(lifecycle)) return 'border-amber-300 bg-amber-50 text-amber-700';
    return 'border-gray-300 bg-gray-100 text-gray-700';
  }
  if (isCurrent) return 'border-purple-300 bg-purple-50 text-purple-700';
  if (isDone) return 'border-green-200 bg-green-50 text-green-700';
  return 'border-border bg-muted/30 text-muted-foreground';
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
