import type { PointerEvent as ReactPointerEvent } from 'react';
import { FolderKanban, ListChecks } from 'lucide-react';
import {
  ActionTileButton,
  ActionTileHoverBar,
  KanbanCardShell,
  StatusBadge,
} from '@/components/shared';
import { cn } from '@/lib/utils';
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
import { DeliveryBoardKanbanCardHeader } from './DeliveryBoardKanbanCardHeader';
import { getDeliveryBoardCardChrome } from './delivery-board-card-chrome';
import { DELIVERY_BOARD_CARD_DIVIDER_BASE_CLASS } from './delivery-board-card-ui.constants';
import {
  getItemId,
  getItemLifecycle,
  getNavigableProductId,
  getProjectId,
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
import { DeliveryCardTeamAvatars } from './DeliveryCardTeamAvatars';
import { getDealTypePresentation, type DealTypePresentation } from '@/lib/deal-type-visual';

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
  /** Hide Project / Task hover row (e.g. drag overlay preview). */
  suppressKanbanHoverInteractions?: boolean;
  /** Opens quick-create task dialog with a PROJECT link (kanban host provides the dialog). */
  onOpenQuickTaskForProject?: (projectId: string) => void;
  /** When true, Task button is disabled (e.g. user has no employee / creator id). */
  quickTaskDisabled?: boolean;
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
  suppressKanbanHoverInteractions = false,
  onOpenQuickTaskForProject,
  quickTaskDisabled = false,
}: ProjectDeliveryBoardCardProps) {
  const lifecycle = getItemLifecycle(item);
  const productId = getNavigableProductId(item);
  const isExtension = item.kind === 'EXTENSION';
  const dealTypeVisual = getDealTypePresentation(isExtension ? 'EXTENSION' : 'PRODUCT');
  const title = isExtension ? item.extension.name : item.product.name;
  const metaLabel = isExtension ? getExtensionMeta(item.extension) : getProductMeta(item.product);
  const isClosedCompact = displayMode === 'closedCompact' && Boolean(lifecycle?.isTerminal);
  const stopKanbanPointerBubble = kanbanActionIsolation
    ? (event: ReactPointerEvent) => {
        event.stopPropagation();
      }
    : undefined;

  const projectId = getProjectId(item);
  const boardChrome = getDeliveryBoardCardChrome(dealTypeVisual);

  return (
    <KanbanCardShell
      preset="crm"
      padding="lg"
      radius="xl"
      baseShadow="sm"
      hoverShadow="md"
      transition="all"
      shellClassName={cn(
        kanbanMinimal ? 'group/kanban-card w-full text-left' : 'group w-full text-left',
        dealTypeVisual.cardShellClassName,
      )}
    >
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
        {kanbanMinimal && !isClosedCompact ? (
          <>
            <DeliveryBoardKanbanCardHeader
              title={title}
              metaLabel={metaLabel}
              visual={dealTypeVisual}
              lifecycle={lifecycle}
            />
            <div
              className={cn(DELIVERY_BOARD_CARD_DIVIDER_BASE_CLASS, boardChrome.dividerClass)}
              aria-hidden
            />
            <DeliveryCardMeta item={item} metaDensity="board" visual={dealTypeVisual} />
            <DeliveryCardTeamAvatars item={item} />
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <CardKindIcon visual={dealTypeVisual} />
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  {metaLabel && (
                    <p className="text-muted-foreground truncate text-xs">{metaLabel}</p>
                  )}
                  {!kanbanMinimal ? (
                    <StatusBadge
                      label={dealTypeVisual.label}
                      variant={dealTypeVisual.badgeVariant}
                      className="mt-1.5 w-fit text-[9px]"
                    />
                  ) : null}
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
            {!kanbanMinimal ? <DeliveryCardTeamAvatars item={item} /> : null}
          </>
        )}
      </button>
      {kanbanMinimal && !isClosedCompact && !suppressKanbanHoverInteractions && projectId ? (
        <DeliveryKanbanCardHoverActions
          projectId={projectId}
          onPointerDown={stopKanbanPointerBubble}
          onOpenQuickTaskForProject={onOpenQuickTaskForProject}
          quickTaskDisabled={quickTaskDisabled}
        />
      ) : null}
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
    </KanbanCardShell>
  );
}

function CardKindIcon({ visual }: { visual: DealTypePresentation }) {
  const Icon = visual.Icon;
  return (
    <span className={`rounded-lg p-1.5 ${visual.iconWrapClassName}`} title={visual.label}>
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

const QUICK_TASK_DISABLED_TITLE = 'Employee profile required to create tasks';

function DeliveryKanbanCardHoverActions({
  projectId,
  onPointerDown,
  onOpenQuickTaskForProject,
  quickTaskDisabled,
}: {
  projectId: string;
  onPointerDown?: (event: ReactPointerEvent) => void;
  onOpenQuickTaskForProject?: (projectId: string) => void;
  quickTaskDisabled: boolean;
}) {
  return (
    <div onPointerDown={onPointerDown}>
      <ActionTileHoverBar variant="kanban-card">
        {onOpenQuickTaskForProject ? (
          <ActionTileButton
            label="Task"
            icon={<ListChecks aria-hidden />}
            tone="primary"
            size="card"
            disabled={quickTaskDisabled}
            title={quickTaskDisabled ? QUICK_TASK_DISABLED_TITLE : undefined}
            onClick={() => onOpenQuickTaskForProject(projectId)}
          />
        ) : null}
        <ActionTileButton
          label="Project"
          icon={<FolderKanban aria-hidden />}
          tone="neutral"
          size="card"
          href={`/projects/${projectId}`}
        />
      </ActionTileHoverBar>
    </div>
  );
}

function getCardBodyClassName(canOpen: boolean) {
  const base = 'w-full text-left';
  return canOpen ? `${base} cursor-pointer` : `${base} cursor-default opacity-80`;
}
