'use client';

import { ArrowRight, Calendar, Package, Puzzle, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type {
  DeliveryLifecycleProjection,
  FullProject,
  ProjectExtensionSummary,
  ProjectProductSummary,
} from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getExtensionSize,
  getExtensionStatus,
  getProductStatus,
  getProductType,
} from '@/features/projects/constants/projects';

const ACTIVE_DELIVERY_STAGES: Array<Exclude<DeliveryLifecycleProjection['stage'], null>> = [
  'STARTING',
  'DEVELOPMENT',
  'QA',
  'TRANSFER',
];

const DELIVERY_STAGE_LABELS: Record<Exclude<DeliveryLifecycleProjection['stage'], null>, string> = {
  STARTING: 'Starting',
  DEVELOPMENT: 'Development',
  QA: 'QA',
  TRANSFER: 'Transfer',
};

type DeliveryBoardItem =
  | { kind: 'PRODUCT'; product: ProjectProductSummary }
  | { kind: 'EXTENSION'; extension: ProjectExtensionSummary };

interface ProjectDeliveryBoardProps {
  project: FullProject;
  onOpenProduct: (productId: string) => void;
}

export function ProjectDeliveryBoard({ project, onOpenProduct }: ProjectDeliveryBoardProps) {
  const activeItems = getActiveBoardItems(project);
  const closedItems = getClosedBoardItems(project);

  return (
    <section className="space-y-4">
      <DeliveryBoardHeader activeCount={activeItems.length} closedCount={closedItems.length} />
      <div className="grid gap-3 xl:grid-cols-4">
        {ACTIVE_DELIVERY_STAGES.map((stage) => (
          <DeliveryStageColumn
            key={stage}
            stage={stage}
            items={activeItems.filter((item) => getItemLifecycle(item)?.stage === stage)}
            onOpenProduct={onOpenProduct}
          />
        ))}
      </div>
      <ClosedDeliveryStrip items={closedItems} onOpenProduct={onOpenProduct} />
    </section>
  );
}

function DeliveryBoardHeader({
  activeCount,
  closedCount,
}: {
  activeCount: number;
  closedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold">Delivery Board</h2>
        <p className="text-muted-foreground text-xs">
          Active Product and Extension cards grouped by canonical delivery stage.
        </p>
      </div>
      <div className="flex gap-2 text-xs">
        <span className="bg-secondary rounded-full px-2 py-1">{activeCount} active</span>
        <span className="bg-secondary rounded-full px-2 py-1">{closedCount} closed</span>
      </div>
    </div>
  );
}

function DeliveryStageColumn({
  stage,
  items,
  onOpenProduct,
}: {
  stage: Exclude<DeliveryLifecycleProjection['stage'], null>;
  items: DeliveryBoardItem[];
  onOpenProduct: (productId: string) => void;
}) {
  return (
    <div className="bg-muted/30 border-border min-h-40 rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{DELIVERY_STAGE_LABELS[stage]}</h3>
        <span className="text-muted-foreground text-xs">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-xs">No cards</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <DeliveryBoardCard key={getItemKey(item)} item={item} onOpenProduct={onOpenProduct} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClosedDeliveryStrip({
  items,
  onOpenProduct,
}: {
  items: DeliveryBoardItem[];
  onOpenProduct: (productId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="bg-muted/20 border-border rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Closed</h3>
        <span className="text-muted-foreground text-xs">{items.length}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <DeliveryBoardCard key={getItemKey(item)} item={item} onOpenProduct={onOpenProduct} />
        ))}
      </div>
    </div>
  );
}

function DeliveryBoardCard({
  item,
  onOpenProduct,
}: {
  item: DeliveryBoardItem;
  onOpenProduct: (productId: string) => void;
}) {
  const lifecycle = getItemLifecycle(item);
  const productId = getNavigableProductId(item);
  const isExtension = item.kind === 'EXTENSION';
  const title = isExtension ? item.extension.name : item.product.name;
  const metaLabel = isExtension ? getExtensionMeta(item.extension) : getProductMeta(item.product);

  return (
    <button
      type="button"
      disabled={!productId}
      onClick={() => productId && onOpenProduct(productId)}
      className={getCardClassName(isExtension, Boolean(productId))}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <CardKindIcon isExtension={isExtension} />
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold">{title}</p>
            {metaLabel && <p className="text-muted-foreground truncate text-xs">{metaLabel}</p>}
          </div>
        </div>
        {lifecycle && <LifecycleBadge lifecycle={lifecycle} item={item} />}
      </div>
      <DeliveryCardMeta item={item} />
      {productId && (
        <div className="text-muted-foreground mt-3 flex items-center justify-end text-xs">
          Open <ArrowRight size={12} className="ml-1" />
        </div>
      )}
    </button>
  );
}

function CardKindIcon({ isExtension }: { isExtension: boolean }) {
  const iconClassName = isExtension
    ? 'bg-orange-500/10 text-orange-500'
    : 'bg-purple-500/10 text-purple-500';
  const Icon = isExtension ? Puzzle : Package;

  return (
    <span className={`rounded-lg p-1.5 ${iconClassName}`}>
      <Icon size={14} />
    </span>
  );
}

function LifecycleBadge({
  lifecycle,
  item,
}: {
  lifecycle: DeliveryLifecycleProjection;
  item: DeliveryBoardItem;
}) {
  const status =
    item.kind === 'PRODUCT'
      ? getProductStatus(item.product.status)
      : getExtensionStatus(item.extension.status);
  const label = formatDeliveryLifecycleLabel(lifecycle);
  return <StatusBadge label={label} variant={status?.variant ?? 'gray'} />;
}

function DeliveryCardMeta({ item }: { item: DeliveryBoardItem }) {
  if (item.kind === 'PRODUCT') {
    return <ProductCardMeta product={item.product} />;
  }
  return <ExtensionCardMeta extension={item.extension} />;
}

function ProductCardMeta({ product }: { product: ProjectProductSummary }) {
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {product.pm && (
        <MetaLine icon={User} label={`${product.pm.firstName} ${product.pm.lastName}`} />
      )}
      {product.deadline && (
        <MetaLine icon={Calendar} label={new Date(product.deadline).toLocaleDateString()} />
      )}
      <p className="text-muted-foreground text-xs">
        {product._count.tasks} tasks · {product._count.extensions} ext. · {product._count.tickets}{' '}
        tickets
      </p>
    </div>
  );
}

function ExtensionCardMeta({ extension }: { extension: ProjectExtensionSummary }) {
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {extension.assignee && (
        <MetaLine
          icon={User}
          label={`${extension.assignee.firstName} ${extension.assignee.lastName}`}
        />
      )}
      <p className="text-muted-foreground text-xs">
        {extension.product?.name ?? 'No linked product'} · {extension._count.tasks} tasks
      </p>
    </div>
  );
}

function MetaLine({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Icon size={12} />
      <span className="truncate">{label}</span>
    </p>
  );
}

function getActiveBoardItems(project: FullProject) {
  return getBoardItems(project).filter((item) => {
    const lifecycle = getItemLifecycle(item);
    return lifecycle?.isActive && lifecycle.stage !== null;
  });
}

function getClosedBoardItems(project: FullProject) {
  return getBoardItems(project).filter((item) => getItemLifecycle(item)?.isTerminal);
}

function getBoardItems(project: FullProject): DeliveryBoardItem[] {
  return [
    ...project.products.map((product) => ({ kind: 'PRODUCT' as const, product })),
    ...project.extensions.map((extension) => ({ kind: 'EXTENSION' as const, extension })),
  ];
}

function getItemLifecycle(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT'
    ? item.product.deliveryLifecycle
    : item.extension.deliveryLifecycle;
}

function getItemKey(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT' ? `product-${item.product.id}` : `extension-${item.extension.id}`;
}

function getNavigableProductId(item: DeliveryBoardItem) {
  return item.kind === 'PRODUCT' ? item.product.id : item.extension.productId;
}

function getProductMeta(product: ProjectProductSummary) {
  return getProductType(product.productType)?.label ?? product.productType;
}

function getExtensionMeta(extension: ProjectExtensionSummary) {
  return getExtensionSize(extension.size)?.label ?? extension.size;
}

function getCardClassName(isExtension: boolean, canOpen: boolean) {
  const base = 'bg-card border-border w-full rounded-xl border p-3 text-left transition-colors';
  const hover = canOpen ? ' hover:border-accent/50 cursor-pointer' : ' cursor-default opacity-80';
  const accent = isExtension ? ' border-l-4 border-l-orange-400' : '';
  return `${base}${hover}${accent}`;
}
