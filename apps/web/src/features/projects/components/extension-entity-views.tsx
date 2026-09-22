'use client';

import { Puzzle, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PRODUCT_DETAIL_CARD_GRID_CLASS, StatusBadge } from '@/components/shared';
import { DeliveryDealRowHoverActions } from '@/features/projects/components/delivery-deal-action-tiles';
import { translateDeliveryLifecycleLabel } from '@/features/projects/components/delivery-board/delivery-board-message-keys';
import { ExtensionEntityCard } from '@/features/projects/components/extension-entity-card';
import { getExtensionStatus } from '@/features/projects/constants/projects';
import {
  PROJECT_ENTITY_LIST_CLASS,
  PROJECT_ENTITY_LIST_ROW_CLASS,
} from '@/features/projects/components/project-detail-layout.constants';
import type { ExtensionEntityViewModel } from '@/features/projects/utils/extension-entity-view-model';

interface ExtensionEntityViewsProps {
  extensions: ExtensionEntityViewModel[];
  viewMode: 'card' | 'list';
  onOpenDeliveryCard: (id: string) => void;
  onOpenDeal: (dealId: string) => void;
  /** Optional — open parent product page when clicking the product name area. */
  onOpenProduct?: (productId: string) => void;
}

export function ExtensionEntityViews({
  extensions,
  viewMode,
  onOpenDeliveryCard,
  onOpenDeal,
  onOpenProduct,
}: ExtensionEntityViewsProps) {
  if (viewMode === 'list') {
    return (
      <div className={PROJECT_ENTITY_LIST_CLASS}>
        {extensions.map((extension) => (
          <ExtensionEntityListRow
            key={extension.id}
            extension={extension}
            onOpenDeliveryCard={() => onOpenDeliveryCard(extension.id)}
            onOpenDeal={extension.dealId ? () => onOpenDeal(extension.dealId!) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={PRODUCT_DETAIL_CARD_GRID_CLASS}>
      {extensions.map((extension) => (
        <ExtensionEntityCard
          key={extension.id}
          extension={extension}
          onOpenDeliveryCard={() => onOpenDeliveryCard(extension.id)}
          onOpenDeal={extension.dealId ? () => onOpenDeal(extension.dealId!) : undefined}
          onOpenProduct={onOpenProduct}
        />
      ))}
    </div>
  );
}

export function ExtensionEntityListRow({
  extension,
  onOpenDeliveryCard,
  onOpenDeal,
}: {
  extension: ExtensionEntityViewModel;
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
}) {
  const t = useTranslations('deliveryBoard');
  const status = getExtensionStatus(extension.status);
  const statusLabel = extension.deliveryLifecycle
    ? translateDeliveryLifecycleLabel(extension.deliveryLifecycle, t)
    : status?.label;

  return (
    <div className={`${PROJECT_ENTITY_LIST_ROW_CLASS} group/entity-row`}>
      <Puzzle className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <button type="button" onClick={onOpenDeliveryCard} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{extension.name}</span>
          {statusLabel ? (
            <StatusBadge
              label={statusLabel}
              variant={status?.variant ?? 'gray'}
              className="shrink-0 self-center"
            />
          ) : null}
        </div>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          {extension.productName ? <span className="truncate">{extension.productName}</span> : null}
          {extension.assignee ? (
            <span className="inline-flex items-center gap-1">
              <User size={11} aria-hidden />
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          ) : null}
          {extension.taskCount != null ? <span>{extension.taskCount} tasks</span> : null}
          {extension.createdAt ? (
            <span>{new Date(extension.createdAt).toLocaleDateString()}</span>
          ) : null}
        </div>
      </button>
      <DeliveryDealRowHoverActions
        onOpenDeliveryCard={onOpenDeliveryCard}
        onOpenDeal={onOpenDeal}
      />
    </div>
  );
}
