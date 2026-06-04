'use client';

import type { MouseEvent } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
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
        'border-border pointer-events-none flex flex-wrap justify-end gap-1.5 border-t pt-2 opacity-0 transition-opacity duration-150',
        'group-hover/entity-card:pointer-events-auto group-hover/entity-card:opacity-100',
        'group-focus-within/entity-card:pointer-events-auto group-focus-within/entity-card:opacity-100',
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={onOpenDeliveryCard}
      >
        Delivery Card
      </Button>
      {onOpenDeal ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          onClick={onOpenDeal}
        >
          Deal
        </Button>
      ) : null}
    </div>
  );
}

/** Compact actions for list rows (always visible on hover via parent group). */
export function EntityDeliveryDealHoverActionsInline({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: EntityDeliveryDealHoverActionsProps) {
  return (
    <div
      className={cn(
        'pointer-events-none flex shrink-0 flex-wrap items-center gap-1 opacity-0 transition-opacity duration-150',
        'group-hover/entity-row:pointer-events-auto group-hover/entity-row:opacity-100',
        'group-focus-within/entity-row:pointer-events-auto group-focus-within/entity-row:opacity-100',
        className,
      )}
      onPointerDown={stopCardClick}
      onClick={stopCardClick}
    >
      <button
        type="button"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 text-xs')}
        onClick={onOpenDeliveryCard}
      >
        Delivery Card
      </button>
      {onOpenDeal ? (
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'h-7 text-xs')}
          onClick={onOpenDeal}
        >
          Deal
        </button>
      ) : null}
    </div>
  );
}
