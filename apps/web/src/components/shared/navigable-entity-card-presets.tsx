'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  Building2,
  Calendar,
  FolderKanban,
  ListChecks,
  Package,
  ShoppingBag,
  User,
} from 'lucide-react';
import {
  EntityLinkedSheetsHoverActions,
  NavigableEntityCard,
  StatusBadge,
  type NavigableEntityCardBadge,
  type NavigableEntityCardMetaLine,
} from '@/components/shared';
import {
  NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
  PROJECT_HUB_CARD_CODE_PILL_CLASS,
  PROJECT_HUB_CARD_ICON_TILE_CLASS,
  PROJECT_HUB_CARD_META_ROW_CLASS,
  PROJECT_HUB_CARD_ORDERS_PILL_CLASS,
  PROJECT_HUB_CARD_SHELL_CLASS,
} from '@/components/shared/navigable-entity-card.constants';
import { cn } from '@/lib/utils';
import {
  buildProductDetailPageHref,
  PRODUCT_DETAIL_TAB,
} from '@/features/projects/constants/product-detail-tab';
import {
  formatDeliveryLifecycleLabel,
  getProductStatus,
  getProductType,
} from '@/features/projects/constants/projects';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';
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
}

function buildProductCardMeta(product: ProjectProductSummary): NavigableEntityCardMetaLine[] {
  const lines: NavigableEntityCardMetaLine[] = [];
  if (product.pm) {
    lines.push({
      icon: User,
      text: `${product.pm.firstName} ${product.pm.lastName}`,
    });
  }
  if (product.deadline) {
    lines.push({
      icon: Calendar,
      text: new Date(product.deadline).toLocaleDateString(),
    });
  }
  return lines;
}

function buildProductStatusBadge(product: ProjectProductSummary): NavigableEntityCardBadge | null {
  const status = getProductStatus(product.status);
  const statusLabel = product.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(product.deliveryLifecycle)
    : status?.label;
  if (!status || !statusLabel) return null;
  return { label: statusLabel, variant: status.variant };
}

/** Project Hub directory card. */
export function ProjectNavigableCard({ project }: { project: Project }) {
  const contactName =
    `${project.contact?.firstName ?? ''} ${project.contact?.lastName ?? ''}`.trim();
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
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className={PROJECT_HUB_CARD_CODE_PILL_CLASS}>{project.code}</span>
              {project.trashedAt != null ? (
                <Archive
                  size={14}
                  className="text-muted-foreground shrink-0"
                  aria-label="In Trash"
                />
              ) : null}
            </div>
            <h3 className="text-foreground line-clamp-2 text-base font-bold tracking-tight">
              {project.name}
            </h3>
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

        <div className="mt-auto flex justify-end pt-4">
          <span className={PROJECT_HUB_CARD_ORDERS_PILL_CLASS}>
            <ShoppingBag className="size-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            {ordersLabel}
          </span>
        </div>
      </Link>
    </div>
  );
}

function workSpaceHubCodePill(workspace: WorkSpace): string | null {
  return workspace.project?.code ?? null;
}

function workSpaceHubMetaRows(workspace: WorkSpace): Array<{ icon: LucideIcon; text: string }> {
  const rows: Array<{ icon: LucideIcon; text: string }> = [];

  if (workspace.type === 'PRODUCT_DELIVERY') {
    if (workspace.project?.name) {
      rows.push({ icon: Building2, text: workspace.project.name });
    }
    return rows;
  }

  if (workspace.product?.name) {
    rows.push({ icon: Package, text: workspace.product.name });
  }
  if (workspace.project?.name) {
    rows.push({ icon: Building2, text: workspace.project.name });
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

/** Work Spaces directory card — aligned with {@link ProjectNavigableCard}. */
export function WorkSpaceNavigableCard({
  workspace,
  onOpenProductDelivery,
  onOpenProductDeal,
}: WorkSpaceNavigableCardProps) {
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;
  const tasksLabel = `${taskCount} task${taskCount === 1 ? '' : 's'}`;
  const isProductDelivery = workspace.type === 'PRODUCT_DELIVERY';
  const CardIcon = isProductDelivery ? Package : FolderKanban;
  const metaRows = workSpaceHubMetaRows(workspace);
  const codePill = workSpaceHubCodePill(workspace);
  const dealId = workspace.product ? getEntityOrderDealId(workspace.product.order) : null;
  const contextHref =
    workspace.productId && workspace.projectId
      ? buildProductDetailPageHref(
          workspace.projectId,
          workspace.productId,
          PRODUCT_DETAIL_TAB.overview,
        )
      : undefined;

  const hoverActions =
    isProductDelivery && workspace.productId && onOpenProductDelivery ? (
      <EntityLinkedSheetsHoverActions
        contextHref={contextHref}
        onOpenDelivery={() => onOpenProductDelivery(workspace.productId!)}
        onOpenDeal={dealId && onOpenProductDeal ? () => onOpenProductDeal(dealId) : undefined}
        variant="project-hub-card-footer"
      />
    ) : null;

  if (isProductDelivery) {
    return (
      <div
        className={cn(
          PROJECT_HUB_CARD_SHELL_CLASS,
          NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS,
          'relative h-auto self-start',
        )}
      >
        <Link
          href={`/work-spaces/${workspace.id}`}
          className="block p-4 focus-visible:outline-none"
        >
          <div className="flex items-start gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <CardIcon className="size-4" aria-hidden />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <h3 className="text-foreground line-clamp-2 min-w-0 text-sm font-bold tracking-tight">
                  {workspace.name}
                </h3>
                <StatusBadge
                  label={workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
                  variant={workspace.scrumEnabled ? 'blue' : 'gray'}
                  className="shrink-0"
                />
              </div>
              {codePill ? (
                <span className={cn(PROJECT_HUB_CARD_CODE_PILL_CLASS, 'w-fit')}>{codePill}</span>
              ) : null}
              {metaRows.map((row) => {
                const RowIcon = row.icon;
                return (
                  <span key={row.text} className={PROJECT_HUB_CARD_META_ROW_CLASS}>
                    <RowIcon className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{row.text}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </Link>
        <div className="relative min-h-9 px-4 pt-1 pb-4">
          <div
            className={cn(
              'flex justify-end transition-opacity duration-150',
              hoverActions &&
                'group-focus-within/project-hub-card:opacity-0 group-hover/project-hub-card:opacity-0',
            )}
          >
            <span className={PROJECT_HUB_CARD_ORDERS_PILL_CLASS}>
              <ListChecks className="size-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />
              {tasksLabel}
            </span>
          </div>
          {hoverActions ? (
            <div
              className={cn(
                'absolute inset-x-4 top-1 bottom-4 flex items-center justify-end gap-2',
                'pointer-events-none opacity-0 transition-opacity duration-150',
                'group-hover/project-hub-card:pointer-events-auto group-hover/project-hub-card:opacity-100',
                'group-focus-within/project-hub-card:pointer-events-auto group-focus-within/project-hub-card:opacity-100',
              )}
            >
              {hoverActions}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(PROJECT_HUB_CARD_SHELL_CLASS, NAVIGABLE_ENTITY_CARD_ELEVATED_CLASS)}>
      <Link
        href={`/work-spaces/${workspace.id}`}
        className="flex min-h-0 flex-1 flex-col p-5 focus-visible:outline-none"
      >
        <div className="flex items-start gap-3">
          <div className={PROJECT_HUB_CARD_ICON_TILE_CLASS}>
            <CardIcon className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-foreground min-w-0 text-base font-bold tracking-tight">
                {workspace.name}
              </h3>
              <StatusBadge
                label={getWorkSpaceTypeLabel(workspace.type)}
                variant={getWorkSpaceTypeVariant(workspace.type)}
                className="shrink-0"
              />
              <StatusBadge
                label={workspace.scrumEnabled ? 'Scrum' : 'Kanban'}
                variant={workspace.scrumEnabled ? 'blue' : 'gray'}
                className="shrink-0"
              />
            </div>
            {metaRows.length > 0 ? (
              <div className="mt-3 flex flex-col gap-1.5">
                {metaRows.map((row) => {
                  const RowIcon = row.icon;
                  return (
                    <span key={row.text} className={PROJECT_HUB_CARD_META_ROW_CLASS}>
                      <RowIcon className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{row.text}</span>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex justify-end pt-4">
          <span className={PROJECT_HUB_CARD_ORDERS_PILL_CLASS}>
            <ListChecks className="size-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            {tasksLabel}
          </span>
        </div>
      </Link>
    </div>
  );
}

/** Project detail product card. */
export function ProductNavigableCard({ projectId, product }: ProductNavigableCardProps) {
  const { openDeliveryItem, openDeal } = useEntityDetailSheetUrl();
  const dealId = getEntityOrderDealId(product.order);
  const productType = getProductType(product.productType);
  const statusBadge = buildProductStatusBadge(product);

  return (
    <NavigableEntityCard
      href={buildProductDetailPageHref(projectId, product.id)}
      icon={Package}
      eyebrow={productType?.label}
      title={product.name}
      badges={statusBadge ? [statusBadge] : undefined}
      metaLines={buildProductCardMeta(product)}
      footer={
        <span>
          {product._count.tasks} tasks · {product._count.extensions} ext. · {product._count.tickets}{' '}
          tickets
        </span>
      }
      hoverActions={
        <EntityLinkedSheetsHoverActions
          contextHref={`/projects/${projectId}`}
          onOpenDelivery={() => openDeliveryItem(`product-${product.id}`)}
          onOpenDeal={dealId ? () => openDeal(dealId) : undefined}
        />
      }
    />
  );
}
