'use client';

import type { MouseEvent } from 'react';
import { Handshake, LayoutGrid } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { cn } from '@/lib/utils';

interface EntityDeliveryDealHoverActionsProps {
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  className?: string;
}

function stopCardClick(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

const CARD_HOVER_REVEAL_CLASS = [
  'pointer-events-none opacity-0 transition-opacity duration-150',
  'group-hover/entity-card:pointer-events-auto group-hover/entity-card:opacity-100',
  'group-focus-within/entity-card:pointer-events-auto group-focus-within/entity-card:opacity-100',
].join(' ');

const ROW_HOVER_REVEAL_CLASS = [
  'pointer-events-none opacity-0 transition-opacity duration-150',
  'group-hover/entity-row:pointer-events-auto group-hover/entity-row:opacity-100',
  'group-focus-within/entity-row:pointer-events-auto group-focus-within/entity-row:opacity-100',
].join(' ');

export function EntityDeliveryDealHoverActions({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: EntityDeliveryDealHoverActionsProps) {
  return (
    <div
      onPointerDown={stopCardClick}
      onClick={stopCardClick}
      className={cn(
        'border-border flex flex-wrap justify-end gap-1.5 border-t pt-2',
        CARD_HOVER_REVEAL_CLASS,
        className,
      )}
    >
      <ActionTileButton
        label="Delivery Card"
        icon={<LayoutGrid aria-hidden />}
        tone="sky"
        size="sm"
        onClick={onOpenDeliveryCard}
      />
      {onOpenDeal ? (
        <ActionTileButton
          label="Deal"
          icon={<Handshake aria-hidden />}
          tone="violet"
          size="sm"
          onClick={onOpenDeal}
        />
      ) : null}
    </div>
  );
}

export function EntityDeliveryDealHoverActionsInline({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: EntityDeliveryDealHoverActionsProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-1',
        ROW_HOVER_REVEAL_CLASS,
        className,
      )}
      onPointerDown={stopCardClick}
      onClick={stopCardClick}
    >
      <ActionTileButton
        label="Delivery Card"
        icon={<LayoutGrid aria-hidden />}
        tone="sky"
        size="sm"
        onClick={onOpenDeliveryCard}
      />
      {onOpenDeal ? (
        <ActionTileButton
          label="Deal"
          icon={<Handshake aria-hidden />}
          tone="violet"
          size="sm"
          onClick={onOpenDeal}
        />
      ) : null}
    </div>
  );
}
