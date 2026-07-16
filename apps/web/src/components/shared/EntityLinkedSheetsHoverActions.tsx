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

/** Context, Delivery, and Deal tiles — hover or always-visible footer. */
export function EntityLinkedSheetsHoverActions({
  contextHref,
  onOpenDelivery,
  onOpenDeal,
  variant = 'card',
}: EntityLinkedSheetsHoverActionsProps) {
  const hasDeal = Boolean(onOpenDeal);
  const isFooter = variant === 'card-footer';
  const tileSize = isFooter ? 'stack' : 'card';
  const tileClassName = isFooter ? 'w-full min-w-0' : undefined;

  return (
    <ActionTileHoverBar variant={variant}>
      {contextHref ? (
        <ActionTileButton
          label="Context"
          icon={<Package aria-hidden />}
          tone="neutral"
          size={tileSize}
          href={contextHref}
          openInNewTab={false}
          className={tileClassName}
        />
      ) : null}
      <ActionTileButton
        label="Delivery"
        icon={<LayoutGrid aria-hidden />}
        tone="sky"
        size={tileSize}
        onClick={onOpenDelivery}
        className={tileClassName}
      />
      <ActionTileButton
        label="Deal"
        icon={<Handshake aria-hidden />}
        tone="violet"
        size={tileSize}
        onClick={onOpenDeal}
        disabled={!hasDeal}
        title={hasDeal ? undefined : NO_LINKED_DEAL_TITLE}
        className={tileClassName}
      />
    </ActionTileHoverBar>
  );
}
