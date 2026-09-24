'use client';

import { Calendar, Puzzle, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  NAVIGABLE_ENTITY_CARD_SOFT_ELEVATED_CLASS,
  PRODUCT_DETAIL_CARD_ICON_TILE_CLASS,
  PRODUCT_DETAIL_CARD_SECTION_DIVIDER_CLASS,
  PRODUCT_DETAIL_CARD_SHELL_CLASS,
  StatusBadge,
} from '@/components/shared';
import { DeliveryDealCardHoverActions } from '@/features/projects/components/delivery-deal-action-tiles';
import { translateDeliveryLifecycleLabel } from '@/features/projects/components/delivery-board/delivery-board-message-keys';
import { getExtensionStatus } from '@/features/projects/constants/projects';
import type { ExtensionEntityViewModel } from '@/features/projects/utils/extension-entity-view-model';
import { cn } from '@/lib/utils';

function ExtensionEntityCardProductLine({
  extension,
  statusLabel,
  status,
  onOpenProduct,
}: {
  extension: ExtensionEntityViewModel;
  statusLabel?: string;
  status: ReturnType<typeof getExtensionStatus>;
  onOpenProduct?: (productId: string) => void;
}) {
  return (
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
  );
}

function ExtensionEntityCardMeta({ extension }: { extension: ExtensionEntityViewModel }) {
  const assigneeName = extension.assignee
    ? `${extension.assignee.firstName} ${extension.assignee.lastName}`
    : null;
  if (!assigneeName && !extension.createdAt) return null;

  return (
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
          <span className="truncate">{new Date(extension.createdAt).toLocaleDateString()}</span>
        </div>
      ) : null}
    </div>
  );
}

function ExtensionEntityCardBody({
  extension,
  statusLabel,
  status,
  onOpenProduct,
}: {
  extension: ExtensionEntityViewModel;
  statusLabel?: string;
  status: ReturnType<typeof getExtensionStatus>;
  onOpenProduct?: (productId: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col p-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className={PRODUCT_DETAIL_CARD_ICON_TILE_CLASS}>
          <Puzzle size={22} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <ExtensionEntityCardProductLine
            extension={extension}
            statusLabel={statusLabel}
            status={status}
            onOpenProduct={onOpenProduct}
          />
          <h3 className="text-foreground line-clamp-2 min-h-[2.75rem] text-lg leading-snug font-bold tracking-tight">
            {extension.name}
          </h3>
        </div>
      </div>
      <ExtensionEntityCardMeta extension={extension} />
      <div className="min-h-4 flex-1" aria-hidden />
    </div>
  );
}

function ExtensionEntityCardFrame({
  extension,
  statusLabel,
  status,
  onOpenDeliveryCard,
  onOpenDeal,
  onOpenProduct,
}: {
  extension: ExtensionEntityViewModel;
  statusLabel?: string;
  status: ReturnType<typeof getExtensionStatus>;
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  onOpenProduct?: (productId: string) => void;
}) {
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
      <ExtensionEntityCardBody
        extension={extension}
        statusLabel={statusLabel}
        status={status}
        onOpenProduct={onOpenProduct}
      />
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
  const t = useTranslations('deliveryBoard');
  const status = getExtensionStatus(extension.status);
  const statusLabel = extension.deliveryLifecycle
    ? translateDeliveryLifecycleLabel(extension.deliveryLifecycle, t)
    : status?.label;

  return (
    <ExtensionEntityCardFrame
      extension={extension}
      statusLabel={statusLabel}
      status={status}
      onOpenDeliveryCard={onOpenDeliveryCard}
      onOpenDeal={onOpenDeal}
      onOpenProduct={onOpenProduct}
    />
  );
}
