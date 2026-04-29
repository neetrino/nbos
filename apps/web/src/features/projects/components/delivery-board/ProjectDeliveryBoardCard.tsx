import { ArrowRight, Calendar, CheckCircle2, Package, Play, Puzzle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared';
import type {
  DeliveryLifecycleProjection,
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
import {
  getItemLifecycle,
  getNavigableProductId,
  NEXT_DELIVERY_STAGE,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

interface ProjectDeliveryBoardCardProps {
  item: DeliveryBoardItem;
  isActionBusy: boolean;
  onOpenProduct: (productId: string) => void;
  onMoveNext: (item: DeliveryBoardItem) => void;
  onResume: (item: DeliveryBoardItem) => void;
  onComplete: (item: DeliveryBoardItem) => void;
}

export function ProjectDeliveryBoardCard({
  item,
  isActionBusy,
  onOpenProduct,
  onMoveNext,
  onResume,
  onComplete,
}: ProjectDeliveryBoardCardProps) {
  const lifecycle = getItemLifecycle(item);
  const productId = getNavigableProductId(item);
  const isExtension = item.kind === 'EXTENSION';
  const title = isExtension ? item.extension.name : item.product.name;
  const metaLabel = isExtension ? getExtensionMeta(item.extension) : getProductMeta(item.product);

  return (
    <div className={getCardClassName(isExtension)}>
      <button
        type="button"
        disabled={!productId}
        onClick={() => productId && onOpenProduct(productId)}
        className={getCardBodyClassName(Boolean(productId))}
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
      </button>
      <DeliveryCardActions
        item={item}
        disabled={isActionBusy}
        onOpenProduct={() => productId && onOpenProduct(productId)}
        onMoveNext={() => onMoveNext(item)}
        onResume={() => onResume(item)}
        onComplete={() => onComplete(item)}
      />
    </div>
  );
}

function DeliveryCardActions({
  item,
  disabled,
  onOpenProduct,
  onMoveNext,
  onResume,
  onComplete,
}: {
  item: DeliveryBoardItem;
  disabled: boolean;
  onOpenProduct: () => void;
  onMoveNext: () => void;
  onResume: () => void;
  onComplete: () => void;
}) {
  const lifecycle = getItemLifecycle(item);
  if (lifecycle?.isTerminal) {
    return (
      <div className="border-border mt-3 flex justify-end border-t pt-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpenProduct}>
          Open <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border mt-3 flex flex-wrap justify-end gap-1.5 border-t pt-2">
      {lifecycle?.workStatus === 'ON_HOLD' ? (
        <Button
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          disabled={disabled}
          onClick={onResume}
        >
          <Play size={12} /> Resume
        </Button>
      ) : (
        <NextStageButton lifecycle={lifecycle} disabled={disabled} onMoveNext={onMoveNext} />
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        disabled={disabled}
        onClick={onComplete}
      >
        <CheckCircle2 size={12} /> Done
      </Button>
    </div>
  );
}

function NextStageButton({
  lifecycle,
  disabled,
  onMoveNext,
}: {
  lifecycle: DeliveryLifecycleProjection | undefined;
  disabled: boolean;
  onMoveNext: () => void;
}) {
  const nextStage = lifecycle?.stage ? NEXT_DELIVERY_STAGE[lifecycle.stage] : null;
  if (!nextStage) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs"
      disabled={disabled}
      onClick={onMoveNext}
    >
      Move next
    </Button>
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
  return (
    <StatusBadge
      label={formatDeliveryLifecycleLabel(lifecycle)}
      variant={status?.variant ?? 'gray'}
    />
  );
}

function DeliveryCardMeta({ item }: { item: DeliveryBoardItem }) {
  if (item.kind === 'PRODUCT') return <ProductCardMeta product={item.product} />;
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

function getProductMeta(product: ProjectProductSummary) {
  return getProductType(product.productType)?.label ?? product.productType;
}

function getExtensionMeta(extension: ProjectExtensionSummary) {
  return getExtensionSize(extension.size)?.label ?? extension.size;
}

function getCardClassName(isExtension: boolean) {
  const base = 'bg-card border-border w-full rounded-xl border p-3 text-left transition-colors';
  const accent = isExtension ? ' border-l-4 border-l-orange-400' : '';
  return `${base}${accent}`;
}

function getCardBodyClassName(canOpen: boolean) {
  const base = 'w-full text-left';
  return canOpen ? `${base} cursor-pointer` : `${base} cursor-default opacity-80`;
}
