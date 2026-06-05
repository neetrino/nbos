'use client';

import { useCallback, useState } from 'react';
import { FolderKanban, ListChecks, Package } from 'lucide-react';
import { EntityLinkedSheetsHoverActions, NavigableEntityCard } from '@/components/shared';
import {
  buildProductDetailPageHref,
  PRODUCT_DETAIL_TAB,
} from '@/features/projects/constants/product-detail-tab';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';
import type { WorkSpace } from '@/lib/api/tasks';
import {
  getWorkSpaceContextLabel,
  getWorkSpaceTypeLabel,
  getWorkSpaceTypeVariant,
} from './work-space-utils';

interface WorkSpaceCardProps {
  workspace: WorkSpace;
  onOpenProductDelivery?: (productId: string) => void;
  onOpenProductDeal?: (dealId: string) => void;
}

export function WorkSpaceCard({
  workspace,
  onOpenProductDelivery,
  onOpenProductDeal,
}: WorkSpaceCardProps) {
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
