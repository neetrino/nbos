'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Calendar,
  FolderKanban,
  Layers,
  ListChecks,
  Package,
  ShoppingBag,
  User,
} from 'lucide-react';
import {
  EntityLinkedSheetsHoverActions,
  NavigableEntityCard,
  StatusBadge,
  type NavigableEntityCardMetaLine,
} from '@/components/shared';
import {
  NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
  PROJECT_HUB_CARD_ICON_TILE_CLASS,
  PROJECT_HUB_CARD_META_ROW_CLASS,
  PROJECT_HUB_CARD_ORDERS_PILL_CLASS,
  PROJECT_HUB_CARD_SHELL_CLASS,
} from '@/components/shared/navigable-entity-card.constants';
import { useIsMobileViewport } from '@/hooks/use-is-mobile-viewport';
import { cn } from '@/lib/utils';
import {
  buildProductDetailPageHref,
  PRODUCT_DETAIL_TAB,
} from '@/features/projects/constants/product-detail-tab';
import { getProductType } from '@/features/projects/constants/projects';
import { getProductDirectoryBadge } from '@/features/projects/utils/products-hub-directory-badge';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';
import { ProjectHubStatusBadge } from '@/features/projects/components/ProjectHubStatusBadge';
import type { ProjectsHubTab } from '@/features/projects/constants/projects-page-preferences-storage';
import type { Project, ProjectProductSummary } from '@/lib/api/projects';
import type { WorkSpace } from '@/lib/api/tasks';
import {
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from '@/features/tasks/work-spaces/work-space-utils';

interface WorkSpaceNavigableCardProps {
  workspace: WorkSpace;
  onOpenProductDelivery?: (productId: string) => void;
  onOpenProductDeal?: (dealId: string) => void;
}

interface ProductNavigableCardProps {
  projectId: string;
  product: ProjectProductSummary;
  showProjectContext?: boolean;
}

/** Mobile: stack in the top-right; desktop: compact horizontal cluster. */
const WORK_SPACE_CARD_STATUS_STACK_CLASS =
  'flex shrink-0 flex-col items-end gap-1 md:flex-row md:flex-wrap md:items-center';

const WORK_SPACE_CARD_STATUS_BADGE_CLASS = 'shrink-0 self-end md:self-auto';

function WorkSpaceModeBadge({ scrumEnabled }: { scrumEnabled: boolean }) {
  return (
    <StatusBadge
      label={scrumEnabled ? 'Scrum' : 'Kanban'}
      variant={scrumEnabled ? 'blue' : 'gray'}
      className={WORK_SPACE_CARD_STATUS_BADGE_CLASS}
    />
  );
}

function buildProductCardMeta(
  product: ProjectProductSummary,
  showProjectContext: boolean,
): NavigableEntityCardMetaLine[] {
  const lines: NavigableEntityCardMetaLine[] = [];
  if (showProjectContext && product.project) {
    lines.push({ id: 'project', icon: FolderKanban, text: product.project.name });
    if (product.project.company?.name) {
      lines.push({ id: 'company', icon: Building2, text: product.project.company.name });
    }
  }
  if (product.pm) {
    lines.push({
      id: 'pm',
      icon: User,
      text: `${product.pm.firstName} ${product.pm.lastName}`,
    });
  }
  if (product.deadline) {
    lines.push({
      id: 'deadline',
      icon: Calendar,
      text: new Date(product.deadline).toLocaleDateString(),
    });
  }
  return lines;
}

/** Project Hub directory card. */
export function ProjectNavigableCard({
  project,
  tabHint,
}: {
  project: Project;
  tabHint?: ProjectsHubTab;
}) {
  const contactName =
    `${project.contact?.firstName ?? ''} ${project.contact?.lastName ?? ''}`.trim();
  const productCount = project._count.products ?? 0;
  const productsLabel = `${productCount} product${productCount === 1 ? '' : 's'}`;
  const orderCount = project._count.orders;
  const ordersLabel = `${orderCount} order${orderCount === 1 ? '' : 's'}`;

  return (
    <div className={cn(PROJECT_HUB_CARD_SHELL_CLASS, NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS)}>
      <Link
        href={`/projects/${project.id}`}
        className="flex min-h-0 flex-1 flex-col p-5 focus-visible:outline-none"
      >
        <div className="flex items-start gap-3">
          <div className={PROJECT_HUB_CARD_ICON_TILE_CLASS}>
            <FolderKanban className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-foreground line-clamp-2 text-base font-bold tracking-tight">
                {project.name}
              </h3>
              <ProjectHubStatusBadge project={project} tabHint={tabHint} />
            </div>
            {project.company || contactName ? (
              <div className="mt-3 flex flex-col gap-1.5">
                {project.company ? (
                  <span className={PROJECT_HUB_CARD_META_ROW_CLASS}>
                    <Building2 className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{project.company.name}</span>
                  </span>
                ) : null}
                {contactName ? (
                  <span className={PROJECT_HUB_CARD_META_ROW_CLASS}>
                    <User className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{contactName}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-2 pt-4">
          <span className={PROJECT_HUB_CARD_ORDERS_PILL_CLASS}>
            <Package className="size-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            {productsLabel}
          </span>
          <span className={PROJECT_HUB_CARD_ORDERS_PILL_CLASS}>
            <ShoppingBag className="size-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            {ordersLabel}
          </span>
        </div>
      </Link>
    </div>
  );
}

function workSpaceHubMetaRows(workspace: WorkSpace): Array<{ icon: LucideIcon; text: string }> {
  const rows: Array<{ icon: LucideIcon; text: string }> = [];

  if (workspace.type === 'PRODUCT_DELIVERY') {
    if (workspace.project?.name) {
      rows.push({ icon: FolderKanban, text: workspace.project.name });
    }
    return rows;
  }

  if (workspace.product?.name) {
    rows.push({ icon: Layers, text: workspace.product.name });
  }
  if (workspace.project?.name) {
    rows.push({ icon: FolderKanban, text: workspace.project.name });
  }
  if (rows.length === 0) {
    if (workspace.description?.trim()) {
      rows.push({ icon: FolderKanban, text: workspace.description.trim() });
    } else {
      const context = getWorkSpaceContextLabel(workspace);
      if (context) rows.push({ icon: FolderKanban, text: context });
    }
  }

  return rows.slice(0, 2);
}

function WorkSpaceCardMetaRows({ rows }: { rows: Array<{ icon: LucideIcon; text: string }> }) {
  return (
    <>
      {rows.map((row, index) => {
        const RowIcon = row.icon;
        return (
          <span key={`${index}-${row.text}`} className={PROJECT_HUB_CARD_META_ROW_CLASS}>
            <RowIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{row.text}</span>
          </span>
        );
      })}
    </>
  );
}

function WorkSpaceCardTasksPill({ label }: { label: string }) {
  return (
    <span className={PROJECT_HUB_CARD_ORDERS_PILL_CLASS}>
      <ListChecks className="size-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />
      {label}
    </span>
  );
}

function useWorkSpaceCardMobileActions() {
  const isMobileViewport = useIsMobileViewport();
  const [actionsRevealed, setActionsRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobileViewport || !actionsRevealed) return;
    function onPointerDown(event: PointerEvent) {
      if (!cardRef.current?.contains(event.target as Node)) {
        setActionsRevealed(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [actionsRevealed, isMobileViewport]);

  useEffect(() => {
    if (!isMobileViewport) setActionsRevealed(false);
  }, [isMobileViewport]);

  function handleBodyClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!isMobileViewport) return;
    if (!actionsRevealed) {
      event.preventDefault();
      setActionsRevealed(true);
    }
  }

  return { isMobileViewport, actionsRevealed, cardRef, handleBodyClick };
}

function WorkSpaceCardActionFooter({
  tasksLabel,
  actionsRevealed,
  isMobileViewport,
  hasDesktopHoverReveal,
  actions,
}: {
  tasksLabel: string;
  actionsRevealed: boolean;
  isMobileViewport: boolean;
  hasDesktopHoverReveal: boolean;
  actions: ReactNode;
}) {
  const showActions = isMobileViewport ? actionsRevealed : false;
  const hideTasksOnDesktopHover = hasDesktopHoverReveal && !isMobileViewport;

  return (
    <div className="relative min-h-9 px-4 pt-1 pb-4 sm:px-5">
      <div
        className={cn(
          'flex justify-end transition-opacity duration-150',
          hideTasksOnDesktopHover &&
            'group-focus-within/project-hub-card:opacity-0 group-hover/project-hub-card:opacity-0',
          isMobileViewport && actionsRevealed && 'opacity-0',
        )}
      >
        <WorkSpaceCardTasksPill label={tasksLabel} />
      </div>
      <div
        className={cn(
          'absolute inset-x-4 top-1 bottom-4 flex items-center justify-end gap-2 sm:inset-x-5',
          'transition-opacity duration-150',
          isMobileViewport
            ? showActions
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
            : cn(
                'pointer-events-none opacity-0',
                hasDesktopHoverReveal &&
                  'group-hover/project-hub-card:pointer-events-auto group-hover/project-hub-card:opacity-100 group-focus-within/project-hub-card:pointer-events-auto group-focus-within/project-hub-card:opacity-100',
              ),
        )}
      >
        {actions}
      </div>
    </div>
  );
}

/** Work Spaces directory card — aligned with {@link ProjectNavigableCard}. */
export function WorkSpaceNavigableCard({
  workspace,
  onOpenProductDelivery,
  onOpenProductDeal,
}: WorkSpaceNavigableCardProps) {
  const { isMobileViewport, actionsRevealed, cardRef, handleBodyClick } =
    useWorkSpaceCardMobileActions();
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;
  const tasksLabel = `${taskCount} task${taskCount === 1 ? '' : 's'}`;
  const isProductDelivery = workspace.type === 'PRODUCT_DELIVERY';
  const CardIcon = isProductDelivery ? Layers : FolderKanban;
  const metaRows = workSpaceHubMetaRows(workspace);
  const workspaceHref = `/work-spaces/${workspace.id}`;
  const dealId = workspace.product ? getEntityOrderDealId(workspace.product.order) : null;
  const contextHref =
    workspace.productId && workspace.projectId
      ? buildProductDetailPageHref(
          workspace.projectId,
          workspace.productId,
          PRODUCT_DETAIL_TAB.overview,
        )
      : undefined;

  const productHoverActions =
    isProductDelivery && workspace.productId && onOpenProductDelivery ? (
      <EntityLinkedSheetsHoverActions
        contextHref={contextHref}
        onOpenDelivery={() => onOpenProductDelivery(workspace.productId!)}
        onOpenDeal={dealId && onOpenProductDeal ? () => onOpenProductDeal(dealId) : undefined}
        variant="project-hub-card-footer"
      />
    ) : null;

  const footerActions = productHoverActions;
  const hasDesktopHoverReveal = Boolean(productHoverActions);

  const statusBadges = isProductDelivery ? (
    <div className={WORK_SPACE_CARD_STATUS_STACK_CLASS}>
      <WorkSpaceModeBadge scrumEnabled={workspace.scrumEnabled} />
    </div>
  ) : (
    <div className={WORK_SPACE_CARD_STATUS_STACK_CLASS}>
      <StatusBadge
        label={getWorkSpaceTypeLabel(workspace.type)}
        variant={getWorkSpaceTypeVariant(workspace.type)}
        className={WORK_SPACE_CARD_STATUS_BADGE_CLASS}
      />
      <WorkSpaceModeBadge scrumEnabled={workspace.scrumEnabled} />
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={cn(
        PROJECT_HUB_CARD_SHELL_CLASS,
        NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
        'relative h-auto self-start',
      )}
    >
      <Link
        href={workspaceHref}
        onClick={footerActions ? handleBodyClick : undefined}
        className={cn(
          'block focus-visible:outline-none',
          isProductDelivery ? 'p-4' : 'p-5 pb-1',
        )}
      >
        <div className={cn('flex items-start', isProductDelivery ? 'gap-2.5' : 'gap-3')}>
          <div
            className={cn(
              isProductDelivery
                ? 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                : PROJECT_HUB_CARD_ICON_TILE_CLASS,
            )}
          >
            <CardIcon className={isProductDelivery ? 'size-4' : 'size-5'} aria-hidden />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <h3
                className={cn(
                  'text-foreground min-w-0 flex-1 font-bold tracking-tight',
                  isProductDelivery ? 'line-clamp-2 text-sm' : 'text-base',
                )}
              >
                {workspace.name}
              </h3>
              {statusBadges}
            </div>
            {metaRows.length > 0 ? (
              <div className={cn('flex flex-col gap-1.5', !isProductDelivery && 'mt-1.5')}>
                <WorkSpaceCardMetaRows rows={metaRows} />
              </div>
            ) : null}
          </div>
        </div>
      </Link>

      {footerActions ? (
        <WorkSpaceCardActionFooter
          tasksLabel={tasksLabel}
          actionsRevealed={actionsRevealed}
          isMobileViewport={isMobileViewport}
          hasDesktopHoverReveal={hasDesktopHoverReveal}
          actions={footerActions}
        />
      ) : (
        <div className="mt-auto flex justify-end px-5 pt-4 pb-5">
          <WorkSpaceCardTasksPill label={tasksLabel} />
        </div>
      )}
    </div>
  );
}

/** Project detail product card. */
export function ProductNavigableCard({
  projectId,
  product,
  showProjectContext = false,
}: ProductNavigableCardProps) {
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const dealId = getEntityOrderDealId(product.order);
  const productType = getProductType(product.productType);
  const statusBadge = getProductDirectoryBadge(product);

  return (
    <NavigableEntityCard
      href={buildProductDetailPageHref(projectId, product.id)}
      icon={Package}
      eyebrow={productType?.label}
      title={product.name}
      badges={statusBadge ? [statusBadge] : undefined}
      metaLines={buildProductCardMeta(product, showProjectContext)}
      stats={[
        { value: product._count.tasks, label: 'Tasks' },
        { value: product._count.extensions, label: 'Ext.' },
        { value: product._count.tickets, label: 'Tickets' },
      ]}
      hoverActions={
        <EntityLinkedSheetsHoverActions
          contextHref={`/projects/${projectId}`}
          onOpenDelivery={() => openDeliveryItem(`product-${product.id}`)}
          onOpenDeal={dealId ? () => openDeal(dealId) : undefined}
          variant="card-footer"
        />
      }
    />
  );
}
