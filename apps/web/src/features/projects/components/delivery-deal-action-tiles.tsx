'use client';

import { Handshake, LayoutGrid } from 'lucide-react';
import { ActionTileButton, ActionTileHoverBar, type ActionTileSize } from '@/components/shared';
import { cn } from '@/lib/utils';

const NO_LINKED_DEAL_TITLE = 'No linked deal on this product order';

const DELIVERY_ACTION_LABEL_PANEL = 'Delivery Card';
const DELIVERY_ACTION_LABEL_COMPACT = 'Delivery';

interface DeliveryDealTilesProps {
  size: ActionTileSize;
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  fullWidth?: boolean;
}

function DeliveryDealTiles({
  size,
  onOpenDeliveryCard,
  onOpenDeal,
  fullWidth = false,
}: DeliveryDealTilesProps) {
  const hasDeal = Boolean(onOpenDeal);
  const deliveryLabel = size === 'md' ? DELIVERY_ACTION_LABEL_PANEL : DELIVERY_ACTION_LABEL_COMPACT;

  return (
    <>
      <ActionTileButton
        label={deliveryLabel}
        icon={<LayoutGrid aria-hidden />}
        tone="sky"
        size={size}
        fullWidth={fullWidth}
        onClick={onOpenDeliveryCard}
      />
      <ActionTileButton
        label="Deal"
        icon={<Handshake aria-hidden />}
        tone="violet"
        size={size}
        fullWidth={fullWidth}
        onClick={onOpenDeal}
        disabled={!hasDeal}
        title={hasDeal ? undefined : NO_LINKED_DEAL_TITLE}
      />
    </>
  );
}

export function DeliveryDealPanelActions({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: {
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <DeliveryDealTiles
        size="md"
        fullWidth
        onOpenDeliveryCard={onOpenDeliveryCard}
        onOpenDeal={onOpenDeal}
      />
    </div>
  );
}

export function DeliveryDealCardHoverActions({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: {
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  className?: string;
}) {
  return (
    <ActionTileHoverBar variant="card" className={className}>
      <DeliveryDealTiles
        size="card"
        onOpenDeliveryCard={onOpenDeliveryCard}
        onOpenDeal={onOpenDeal}
      />
    </ActionTileHoverBar>
  );
}

export function DeliveryDealRowHoverActions({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: {
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  className?: string;
}) {
  return (
    <ActionTileHoverBar variant="row" className={className}>
      <DeliveryDealTiles
        size="card"
        onOpenDeliveryCard={onOpenDeliveryCard}
        onOpenDeal={onOpenDeal}
      />
    </ActionTileHoverBar>
  );
}
