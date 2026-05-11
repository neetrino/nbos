import type { PointerEvent as ReactPointerEvent } from 'react';
import { Package, Puzzle } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import type {
  DeliveryLifecycleProjection,
  ProjectExtensionSummary,
  ProjectProductSummary,
} from '@/lib/api/projects';
import {
  formatDeliveryLifecycleLabel,
  getExtensionSize,
  getDeliveryLifecycleVariant,
  getProductType,
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
import { DeliveryCardMeta } from './ProjectDeliveryBoardCardMeta';

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
  /**
   * When the card sits inside a kanban drag source, stop pointer propagation on
   * action chrome so Move next / links / cancel remain clickable without starting a drag.
   */
  kanbanActionIsolation?: boolean;
  /**
   * Active delivery kanban: slimmer card — column already shows stage; stage moves via drag;
   * Done / Cancel / deep links live in the detail drawer.
   */
  kanbanMinimal?: boolean;
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
  kanbanActionIsolation = false,
  kanbanMinimal = false,
}: ProjectDeliveryBoardCardProps) {
  const lifecycle = getItemLifecycle(item);
  const productId = getNavigableProductId(item);
  const isExtension = item.kind === 'EXTENSION';
  const title = isExtension ? item.extension.name : item.product.name;
  const metaLabel = isExtension ? getExtensionMeta(item.extension) : getProductMeta(item.product);
  const isClosedCompact = displayMode === 'closedCompact' && Boolean(lifecycle?.isTerminal);
  const stopKanbanPointerBubble = kanbanActionIsolation
    ? (event: ReactPointerEvent) => {
        event.stopPropagation();
      }
    : undefined;

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
            {lifecycle && !kanbanMinimal ? <LifecycleBadge lifecycle={lifecycle} /> : null}
          </div>
        </div>
        {isClosedCompact ? (
          <ClosedCompactCardMeta item={item} />
        ) : (
          <DeliveryCardMeta item={item} metaDensity={kanbanMinimal ? 'minimal' : 'full'} />
        )}
      </button>
      {!isClosedCompact && !kanbanMinimal ? (
        <div onPointerDown={stopKanbanPointerBubble}>
          <ProjectDeliveryBoardContextLinks item={item} onOpenProductTab={onOpenProductTab} />
        </div>
      ) : null}
      {isClosedCompact ? (
        <div onPointerDown={stopKanbanPointerBubble}>
          <ClosedCompactCardActions
            onOpenDetails={onOpenDetails}
            onOpenProduct={() => productId && onOpenProduct(productId)}
          />
        </div>
      ) : !kanbanMinimal ? (
        <div onPointerDown={stopKanbanPointerBubble}>
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
        </div>
      ) : null}
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
