'use client';

import { Calendar, Puzzle, User } from 'lucide-react';
import {
  NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS,
  PRODUCT_DETAIL_CARD_GRID_CLASS,
  PRODUCT_DETAIL_CARD_ICON_TILE_CLASS,
  PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS,
  PRODUCT_DETAIL_CARD_SHELL_CLASS,
  StatusBadge,
} from '@/components/shared';
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
} from '@/features/projects/components/project-detail-layout.constants';
import type { ExtensionEntityViewModel } from '@/features/projects/utils/extension-entity-view-model';
import { cn } from '@/lib/utils';

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
          {statusLabel ? (
            <StatusBadge
              label={statusLabel}
              variant={status?.variant ?? 'gray'}
              className="shrink-0 self-center"
            />
          ) : null}
          {size ? <span className="text-muted-foreground text-xs">{size.label}</span> : null}
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
  const assigneeName = extension.assignee
    ? `${extension.assignee.firstName} ${extension.assignee.lastName}`
    : null;

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        PRODUCT_DETAIL_CARD_SHELL_CLASS,
        NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS,
        'cursor-pointer',
      )}
      onClick={onOpenDeliveryCard}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDeliveryCard();
        }
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex w-12 shrink-0 flex-col items-center gap-1.5">
            <div className={PRODUCT_DETAIL_CARD_ICON_TILE_CLASS}>
              <Puzzle size={22} aria-hidden />
            </div>
            {size ? (
              <span className="text-muted-foreground text-center text-[10px] leading-none font-medium tracking-wide uppercase">
                {size.label}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex min-h-4 min-w-0 items-center gap-2">
              {extension.productName ? (
                onOpenProduct && extension.productId ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground min-w-0 truncate text-left text-xs leading-none underline-offset-2 hover:underline"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenProduct(extension.productId!);
                    }}
                  >
                    {extension.productName}
                  </button>
                ) : (
                  <p className="text-muted-foreground min-w-0 truncate text-xs leading-none">
                    {extension.productName}
                  </p>
                )
              ) : (
                <span className="min-w-0 flex-1" aria-hidden />
              )}
              {statusLabel ? (
                <StatusBadge
                  label={statusLabel}
                  variant={status?.variant ?? 'gray'}
                  dot
                  className="ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                />
              ) : null}
            </div>
            <h3 className="text-foreground line-clamp-2 min-h-[2.75rem] text-lg leading-snug font-bold tracking-tight">
              {extension.name}
            </h3>
          </div>
        </div>

        {assigneeName || extension.createdAt ? (
          <div className={cn(PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS, 'mt-4 space-y-2.5 pt-4')}>
            {assigneeName ? (
              <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
                <User size={15} className="shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{assigneeName}</span>
              </div>
            ) : null}
            {extension.createdAt ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar size={15} className="shrink-0" aria-hidden />
                <span className="truncate">
                  {new Date(extension.createdAt).toLocaleDateString()}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-4 flex-1" aria-hidden />
      </div>

      <div className="px-5 pt-0 pb-5">
        <DeliveryDealCardHoverActions
          onOpenDeliveryCard={onOpenDeliveryCard}
          onOpenDeal={onOpenDeal}
          taskCount={extension.taskCount}
        />
      </div>
    </div>
  );
}
