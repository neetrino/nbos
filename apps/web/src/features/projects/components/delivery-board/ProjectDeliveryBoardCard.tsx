import { Building2, Calendar, Package, Puzzle, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type {
  DeliveryLifecycleProjection,
  ProjectExtensionSummary,
  ProjectProductSummary,
} from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  formatDeliveryHoldUntil,
  getExtensionSize,
  getDeliveryLifecycleVariant,
  getProductType,
  isDeliveryHoldExpired,
} from '@/features/projects/constants/projects';
import { DeliveryStageActionBar } from './DeliveryStageActionBar';
import {
  getItemId,
  getItemLifecycle,
  getNavigableProductId,
  type DeliveryBoardItem,
} from './project-delivery-board-model';
import {
  ProjectDeliveryBoardContextLinks,
  type ProductBoardTab,
} from './ProjectDeliveryBoardContextLinks';
import { DeliveryStageReadinessRing } from './DeliveryStageReadinessRing';
import {
  ClosedCompactCardActions,
  ClosedCompactCardMeta,
} from './ProjectDeliveryBoardClosedCompact';

interface ProjectDeliveryBoardCardProps {
  item: DeliveryBoardItem;
  isActionBusy: boolean;
  onOpenProduct: (productId: string) => void;
  onOpenProductTab: (productId: string, tab: ProductBoardTab) => void;
  /** Opens in-board detail drawer when provided (global Delivery Board). */
  onOpenDetails?: () => void;
  /** Closed Board: compact outside card per canon §7.2 */
  displayMode?: 'full' | 'closedCompact';
  onMoveNext: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

export function ProjectDeliveryBoardCard({
  item,
  isActionBusy,
  onOpenProduct,
  onOpenProductTab,
  onOpenDetails,
  displayMode = 'full',
  onMoveNext,
  onResume,
  onComplete,
  onCancel,
}: ProjectDeliveryBoardCardProps) {
  const lifecycle = getItemLifecycle(item);
  const productId = getNavigableProductId(item);
  const isExtension = item.kind === 'EXTENSION';
  const title = isExtension ? item.extension.name : item.product.name;
  const metaLabel = isExtension ? getExtensionMeta(item.extension) : getProductMeta(item.product);
  const isClosedCompact = displayMode === 'closedCompact' && Boolean(lifecycle?.isTerminal);

  return (
    <div className={getCardClassName(isExtension)}>
      <button
        type="button"
        disabled={!productId && !onOpenDetails}
        onClick={() => {
          if (onOpenDetails) {
            onOpenDetails();
            return;
          }
          if (productId) onOpenProduct(productId);
        }}
        className={getCardBodyClassName(Boolean(productId || onOpenDetails))}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <CardKindIcon isExtension={isExtension} />
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold">{title}</p>
              {metaLabel && <p className="text-muted-foreground truncate text-xs">{metaLabel}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {lifecycle && !lifecycle.isTerminal && lifecycle.stage ? (
              <DeliveryStageReadinessRing lifecycle={lifecycle} />
            ) : null}
            {lifecycle && <LifecycleBadge lifecycle={lifecycle} />}
          </div>
        </div>
        {isClosedCompact ? <ClosedCompactCardMeta item={item} /> : <DeliveryCardMeta item={item} />}
      </button>
      {!isClosedCompact ? (
        <ProjectDeliveryBoardContextLinks item={item} onOpenProductTab={onOpenProductTab} />
      ) : null}
      {isClosedCompact ? (
        <ClosedCompactCardActions
          onOpenDetails={onOpenDetails}
          onOpenProduct={() => productId && onOpenProduct(productId)}
        />
      ) : (
        <DeliveryStageActionBar
          variant="card"
          item={item}
          lifecycle={lifecycle}
          busyItemId={isActionBusy ? getItemId(item) : null}
          onMoveNext={onMoveNext}
          onResume={onResume}
          onComplete={onComplete}
          onCancel={onCancel}
          onOpenProduct={() => productId && onOpenProduct(productId)}
        />
      )}
    </div>
  );
}

function CardKindIcon({ isExtension }: { isExtension: boolean }) {
  const iconClassName = isExtension
    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  const Icon = isExtension ? Puzzle : Package;

  return (
    <span className={`rounded-lg p-1.5 ${iconClassName}`}>
      <Icon size={14} />
    </span>
  );
}

function LifecycleBadge({ lifecycle }: { lifecycle: DeliveryLifecycleProjection }) {
  return (
    <StatusBadge
      label={formatDeliveryLifecycleLabel(lifecycle)}
      variant={getDeliveryLifecycleVariant(lifecycle)}
    />
  );
}

function DeliveryCardMeta({ item }: { item: DeliveryBoardItem }) {
  if (item.kind === 'PRODUCT') return <ProductCardMeta product={item.product} />;
  return <ExtensionCardMeta extension={item.extension} />;
}

function ProductCardMeta({ product }: { product: ProjectProductSummary }) {
  const holdCopy = getHoldCopy(product.deliveryLifecycle);
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {product.project && (
        <MetaLine icon={Building2} label={`${product.project.name} (${product.project.code})`} />
      )}
      {product.pm && (
        <MetaLine icon={User} label={`${product.pm.firstName} ${product.pm.lastName}`} />
      )}
      {product.deadline && (
        <MetaLine icon={Calendar} label={new Date(product.deadline).toLocaleDateString()} />
      )}
      <p className="text-muted-foreground text-xs">
        {product._count.tasks} Work Space tasks · {product._count.extensions} ext. ·{' '}
        {product._count.tickets} tickets
      </p>
      {product.checklistStageProgress && product.checklistStageProgress.total > 0 ? (
        <p className="text-muted-foreground text-xs">
          Checklist {product.checklistStageProgress.completed}/
          {product.checklistStageProgress.total}
        </p>
      ) : null}
      {holdCopy && <p className={getHoldCopyClassName(product.deliveryLifecycle)}>{holdCopy}</p>}
    </div>
  );
}

function ExtensionCardMeta({ extension }: { extension: ProjectExtensionSummary }) {
  const holdCopy = getHoldCopy(extension.deliveryLifecycle);
  return (
    <div className="mt-3 space-y-1.5 text-left">
      {extension.project && (
        <MetaLine
          icon={Building2}
          label={`${extension.project.name} (${extension.project.code})`}
        />
      )}
      {extension.assignee && (
        <MetaLine
          icon={User}
          label={`${extension.assignee.firstName} ${extension.assignee.lastName}`}
        />
      )}
      <p className="text-muted-foreground text-xs">
        {extension.product?.name ?? 'No linked product'} · {extension._count.tasks} Work Space tasks
      </p>
      {extension.checklistStageProgress && extension.checklistStageProgress.total > 0 ? (
        <p className="text-muted-foreground text-xs">
          Checklist {extension.checklistStageProgress.completed}/
          {extension.checklistStageProgress.total}
        </p>
      ) : null}
      {holdCopy && <p className={getHoldCopyClassName(extension.deliveryLifecycle)}>{holdCopy}</p>}
    </div>
  );
}

function getHoldCopy(lifecycle: DeliveryLifecycleProjection | undefined) {
  if (lifecycle?.workStatus !== 'ON_HOLD') return null;
  const date = formatDeliveryHoldUntil(lifecycle.onHoldUntil);
  if (isDeliveryHoldExpired(lifecycle)) return date ? `Hold expired on ${date}` : 'Hold expired';
  return date ? `On hold until ${date}` : 'On hold';
}

function getHoldCopyClassName(lifecycle: DeliveryLifecycleProjection | undefined) {
  const base = 'text-xs font-medium';
  return lifecycle && isDeliveryHoldExpired(lifecycle)
    ? `${base} text-amber-600`
    : `${base} text-muted-foreground`;
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
  const base =
    'group w-full rounded-xl border p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md';
  if (isExtension) {
    return `${base} border-blue-200/90 bg-blue-50/50 dark:border-blue-900/55 dark:bg-blue-950/30`;
  }
  return `${base} bg-card border-border`;
}

function getCardBodyClassName(canOpen: boolean) {
  const base = 'w-full text-left';
  return canOpen ? `${base} cursor-pointer` : `${base} cursor-default opacity-80`;
}
