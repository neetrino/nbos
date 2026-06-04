'use client';

import { Handshake, LayoutGrid } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import { cn } from '@/lib/utils';

interface EntityDetailSheetPanelActionsProps {
  onOpenDeliveryCard: () => void;
  onOpenDeal?: () => void;
  className?: string;
}

export function EntityDetailSheetPanelActions({
  onOpenDeliveryCard,
  onOpenDeal,
  className,
}: EntityDetailSheetPanelActionsProps) {
  const hasDeal = Boolean(onOpenDeal);

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <ActionTileButton
        label="Delivery Card"
        icon={<LayoutGrid aria-hidden />}
        tone="sky"
        size="md"
        fullWidth
        onClick={onOpenDeliveryCard}
      />
      <ActionTileButton
        label="Deal"
        icon={<Handshake aria-hidden />}
        tone="violet"
        size="md"
        fullWidth
        onClick={onOpenDeal}
        disabled={!hasDeal}
        title={hasDeal ? undefined : 'No linked deal on this product order'}
      />
    </div>
  );
}
