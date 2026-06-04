'use client';

import { Puzzle, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared';
import {
  DeliveryDealCardHoverActions,
  DeliveryDealRowHoverActions,
} from '@/features/projects/components/delivery-deal-action-tiles';
import {
  formatDeliveryLifecycleLabel,
  getExtensionSize,
  getExtensionStatus,
} from '@/features/projects/constants/projects';
import {
  PROJECT_ENTITY_LIST_CLASS,
  PROJECT_ENTITY_LIST_ROW_CLASS,
  PROJECT_PRODUCTS_CARD_GRID_CLASS,
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
    <div className={PROJECT_PRODUCTS_CARD_GRID_CLASS}>
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
  const status = getExtensionStatus(extension.status);
  const size = getExtensionSize(extension.size);
  const statusLabel = extension.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(extension.deliveryLifecycle)
    : status?.label;

  return (
    <div className={`${PROJECT_ENTITY_LIST_ROW_CLASS} group/entity-row`}>
      <Puzzle className="text-muted-foreground size-4 shrink-0" aria-hidden />
      <button type="button" onClick={onOpenDeliveryCard} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{extension.name}</span>
          {size && <span className="text-muted-foreground text-xs">{size.label}</span>}
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
      {statusLabel ? (
        <StatusBadge label={statusLabel} variant={status?.variant ?? 'gray'} className="shrink-0" />
      ) : null}
      <DeliveryDealRowHoverActions
        onOpenDeliveryCard={onOpenDeliveryCard}
        onOpenDeal={onOpenDeal}
      />
    </div>
  );
}

export function ExtensionEntityCard({
  extension,
  onOpenDeliveryCard,
  onOpenDeal,
  onOpenProduct,
}: {
  extension: ExtensionEntityViewModel;
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  onOpenProduct?: (productId: string) => void;
}) {
  const status = getExtensionStatus(extension.status);
  const size = getExtensionSize(extension.size);
  const statusLabel = extension.deliveryLifecycle
    ? formatDeliveryLifecycleLabel(extension.deliveryLifecycle)
    : status?.label;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDeliveryCard}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDeliveryCard();
        }
      }}
      className="bg-card border-border hover:border-accent/50 group/entity-card flex h-full min-h-36 min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border p-4 transition-colors"
    >
      <div className="min-w-0 shrink-0">
        <div className="flex items-start gap-2">
          <Puzzle className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold">{extension.name}</h4>
            {extension.productName && onOpenProduct ? (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground truncate text-left text-xs underline-offset-2 hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  if (extension.productId) onOpenProduct(extension.productId);
                }}
              >
                {extension.productName}
              </button>
            ) : extension.productName ? (
              <p className="text-muted-foreground truncate text-xs">{extension.productName}</p>
            ) : null}
          </div>
        </div>
        {(size || status) && (
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-2 text-xs">
            {size && <span>{size.label}</span>}
            {status && !extension.deliveryLifecycle && <span>{status.label}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1">
        {extension.assignee ? (
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <User size={12} aria-hidden />
            <span className="truncate">
              {extension.assignee.firstName} {extension.assignee.lastName}
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2">
        {extension.taskCount != null ? (
          <div className="text-muted-foreground text-[10px]">{extension.taskCount} tasks</div>
        ) : null}
        {statusLabel ? (
          <StatusBadge
            label={statusLabel}
            variant={status?.variant ?? 'gray'}
            title={statusLabel}
          />
        ) : null}
        <DeliveryDealCardHoverActions
          onOpenDeliveryCard={onOpenDeliveryCard}
          onOpenDeal={onOpenDeal}
        />
      </div>
    </div>
  );
}
