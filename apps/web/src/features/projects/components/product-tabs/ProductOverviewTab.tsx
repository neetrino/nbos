'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { DollarSign, ListChecks, Puzzle, Ticket } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type { FullProduct } from '@/lib/api/products';
import { getProductDeliveryStageBadgeDisplay } from '@/features/projects/constants/delivery-stage-display';
import { getProductType } from '@/features/projects/constants/projects';
import {
  buildProductGateRequiredFields,
  productStageGateFieldClass,
  resolveProductTabFromGateErrors,
  type ProductTabForGate,
} from '@/features/projects/product-stage-gate-highlight';
import type { SheetStageGateHighlight } from '@/lib/stage-gate-highlight';
import type { ApiFieldError } from '@/lib/api-errors';
import { ProductStageGateCard } from './ProductStageGateCard';
import { ProductParticipantsSection } from '@/features/platform-access/components/ProductParticipantsSection';
import { OverviewMetaGrid, OverviewMetaTile, OverviewPanel } from './product-overview-ui';
import { cn } from '@/lib/utils';

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
    <div className="space-y-4">
      <ProductStats product={product} doneTasks={doneTasks} doneExtensions={doneExtensions} />
      <div className="grid gap-4 xl:grid-cols-12 xl:items-start">
        <div className="space-y-4 xl:col-span-4">
          <ProductDetailsCard product={product} gateRequiredFields={gateRequiredFields} />
          <ProductDescriptionCard
            description={product.description}
            gateRequiredFields={gateRequiredFields}
            forceVisible={gateRequiredFields.has('description')}
          />
        </div>
        <div className="xl:col-span-8">
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
      </div>
      <ProductParticipantsSection productId={product.id} compact />
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
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <StatChip
        icon={ListChecks}
        label="Tasks"
        value={`${doneTasks}/${product.tasks.length}`}
        tone="bg-blue-500/10 text-blue-700 dark:text-blue-300"
      />
      <StatChip
        icon={Puzzle}
        label="Extensions"
        value={`${doneExtensions}/${product.extensions.length}`}
        tone="bg-purple-500/10 text-purple-700 dark:text-purple-300"
      />
      <StatChip
        icon={Ticket}
        label="Tickets"
        value={String(product.tickets.length)}
        tone="bg-amber-500/10 text-amber-700 dark:text-amber-300"
      />
      <StatChip
        icon={DollarSign}
        label="Order"
        value={
          product.order
            ? `${Number(product.order.totalAmount).toLocaleString()} ${product.order.currency}`
            : '—'
        }
        tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
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
  const productType = getProductType(product.productType);
  const stageStatus = getProductDeliveryStageBadgeDisplay(product);

  return (
    <OverviewPanel title="Product Details">
      <OverviewMetaGrid>
        <OverviewMetaTile label="Type" value={productType?.label ?? '—'} />
        <OverviewMetaTile
          label="Stage"
          value={
            stageStatus ? (
              <StatusBadge label={stageStatus.label} variant={stageStatus.variant} />
            ) : (
              '—'
            )
          }
        />
        {product.pm ? (
          <OverviewMetaTile label="PM" value={`${product.pm.firstName} ${product.pm.lastName}`} />
        ) : null}
        <OverviewMetaTile
          label="Deadline"
          className={productStageGateFieldClass(gateRequiredFields, 'deadline', undefined)}
          value={product.deadline ? new Date(product.deadline).toLocaleDateString() : '—'}
        />
        <OverviewMetaTile
          label="Order"
          className={productStageGateFieldClass(gateRequiredFields, 'order', undefined)}
          value={product.order ? 'Linked' : '—'}
        />
        <OverviewMetaTile
          label="Project"
          value={
            <Link
              href={`/projects/${product.projectId}`}
              className="text-primary block truncate hover:underline"
            >
              {product.project.name}
            </Link>
          }
        />
        <OverviewMetaTile
          label="Created"
          value={new Date(product.createdAt).toLocaleDateString()}
        />
      </OverviewMetaGrid>
    </OverviewPanel>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="bg-card border-border flex items-center gap-2.5 rounded-xl border px-3 py-2.5">
      <div className={cn('rounded-lg p-1.5', tone)}>
        <Icon size={14} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base leading-tight font-semibold">{value}</p>
        <p className="text-muted-foreground text-[11px]">{label}</p>
      </div>
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
    <OverviewPanel
      title="Description"
      bodyClassName={productStageGateFieldClass(gateRequiredFields, 'description', undefined)}
    >
      {description ? (
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      ) : (
        <p className="text-muted-foreground text-sm">Description is required before Starting.</p>
      )}
    </OverviewPanel>
  );
}
