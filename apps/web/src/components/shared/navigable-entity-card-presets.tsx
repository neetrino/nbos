'use client';

import Link from 'next/link';
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

/** Work Spaces directory card. */
export function WorkSpaceNavigableCard({
  workspace,
  onOpenProductDelivery,
  onOpenProductDeal,
}: WorkSpaceNavigableCardProps) {
  const taskCount = workspace._count?.tasks ?? workspace.tasks?.length ?? 0;
  const isProductDelivery = workspace.type === 'PRODUCT_DELIVERY';
  const contextLabel = getWorkSpaceContextLabel(workspace);
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
      />
    ) : null;

  return (
    <NavigableEntityCard
      href={`/work-spaces/${workspace.id}`}
      icon={isProductDelivery ? Package : FolderKanban}
      eyebrow={workspace.project?.code ?? undefined}
      title={workspace.name}
      badges={[
        {
          label: getWorkSpaceTypeLabel(workspace.type),
          variant: getWorkSpaceTypeVariant(workspace.type),
        },
        {
          label: workspace.scrumEnabled ? 'Scrum-enabled' : 'Kanban',
          variant: workspace.scrumEnabled ? 'blue' : 'gray',
        },
      ]}
      description={workspace.description ?? contextLabel}
      metaLines={[
        {
          icon: ListChecks,
          text: `${taskCount} tasks · ${contextLabel}`,
        },
      ]}
      hoverActions={hoverActions}
    />
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
