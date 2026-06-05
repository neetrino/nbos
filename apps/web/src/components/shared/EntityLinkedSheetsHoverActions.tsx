'use client';

import { Handshake, LayoutGrid, Package } from 'lucide-react';
import { ActionTileButton } from './ActionTileButton';
import { ActionTileHoverBar, type ActionTileHoverBarVariant } from './ActionTileHoverBar';

const NO_LINKED_DEAL_TITLE = 'No linked deal on this product order';

interface EntityLinkedSheetsHoverActionsProps {
  /** Product / project context page — opens in same tab. */
  contextHref?: string;
  onOpenDelivery: () => void;
  onOpenDeal?: () => void;
  variant?: ActionTileHoverBarVariant;
}

/** Context, Delivery, and Deal tiles revealed on hover. */
export function EntityLinkedSheetsHoverActions({
  contextHref,
  onOpenDelivery,
  onOpenDeal,
  variant = 'card',
}: EntityLinkedSheetsHoverActionsProps) {
  const hasDeal = Boolean(onOpenDeal);

  return (
    <ActionTileHoverBar variant={variant}>
      {contextHref ? (
        <ActionTileButton
          label="Context"
          icon={<Package aria-hidden />}
          tone="neutral"
          size="card"
          href={contextHref}
          openInNewTab={false}
        />
      ) : null}
      <ActionTileButton
        label="Delivery"
        icon={<LayoutGrid aria-hidden />}
        tone="sky"
        size="card"
        onClick={onOpenDelivery}
      />
      <ActionTileButton
        label="Deal"
        icon={<Handshake aria-hidden />}
        tone="violet"
        size="card"
        onClick={onOpenDeal}
        disabled={!hasDeal}
        title={hasDeal ? undefined : NO_LINKED_DEAL_TITLE}
      />
    </ActionTileHoverBar>
  );
}
