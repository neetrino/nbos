'use client';

import {
  Archive,
  Building2,
  Calendar,
  FolderKanban,
  ListChecks,
  Package,
  User,
} from 'lucide-react';
import {
  EntityLinkedSheetsHoverActions,
  NavigableEntityCard,
  type NavigableEntityCardBadge,
  type NavigableEntityCardMetaLine,
} from '@/components/shared';
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
  const metaLines: NavigableEntityCardMetaLine[] = [];
  if (project.company) {
    metaLines.push({ icon: Building2, text: project.company.name });
  }
  const contactName =
    `${project.contact?.firstName ?? ''} ${project.contact?.lastName ?? ''}`.trim();
  if (contactName) {
    metaLines.push({ icon: User, text: contactName });
  }

  return (
    <NavigableEntityCard
      href={`/projects/${project.id}`}
      icon={FolderKanban}
      eyebrow={project.code}
      title={project.name}
      description={project.description}
      headerTrailing={
        project.isArchived ? (
          <Archive size={14} className="text-muted-foreground shrink-0" />
        ) : undefined
      }
      metaLines={metaLines}
      footer={<span>{project._count.orders} orders</span>}
    />
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
