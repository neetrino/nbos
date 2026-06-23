import { Building2, Calendar, CheckCircle2 } from 'lucide-react';
import { ActionTileButton } from '@/components/shared';
import type { DeliveryBoardItem } from './project-delivery-board-model';
import { getItemLifecycle } from './project-delivery-board-model';

const CANCELLATION_PREVIEW_LEN = 72;

export function ClosedCompactCardMeta({ item }: { item: DeliveryBoardItem }) {
  const lc = getItemLifecycle(item);
  const closedIso = item.kind === 'PRODUCT' ? item.product.updatedAt : item.extension.updatedAt;
  const closedLabel = closedIso ? new Date(closedIso).toLocaleDateString() : '—';

  return (
    <div className="mt-2 space-y-1 text-left">
      {item.kind === 'PRODUCT' && item.product.project && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Building2 size={12} />
          <span className="truncate">
            {item.product.project.name} ({item.product.project.code})
          </span>
        </p>
      )}
      {item.kind === 'EXTENSION' && item.extension.project && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Building2 size={12} />
          <span className="truncate">
            {item.extension.project.name} ({item.extension.project.code})
          </span>
        </p>
      )}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Calendar size={12} />
        <span>Closed {closedLabel}</span>
      </p>
      {lc?.resolution === 'DONE' && item.kind === 'PRODUCT' && item.product.clientAcceptedAt && (
        <p className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 size={12} />
          Client accepted
        </p>
      )}
      {lc?.resolution === 'CANCELLED' && lc.cancellationReason && (
        <p className="text-muted-foreground text-xs leading-snug">
          Cancelled:{' '}
          {lc.cancellationReason.length > CANCELLATION_PREVIEW_LEN
            ? `${lc.cancellationReason.slice(0, CANCELLATION_PREVIEW_LEN)}…`
            : lc.cancellationReason}
        </p>
      )}
    </div>
  );
}

export function ClosedCompactCardActions({
  onOpenDetails,
  onOpenProduct,
}: {
  onOpenDetails?: () => void;
  onOpenProduct: () => void;
}) {
  return (
    <div className="border-border mt-3 flex flex-wrap justify-end gap-1.5 border-t pt-2">
      {onOpenDetails ? (
        <ActionTileButton
          label="Details"
          icon={<CheckCircle2 size={12} aria-hidden />}
          tone="sky"
          size="card"
          onClick={onOpenDetails}
        />
      ) : null}
      <ActionTileButton
        label="Open"
        icon={<Building2 size={12} aria-hidden />}
        tone="neutral"
        size="card"
        onClick={onOpenProduct}
      />
    </div>
  );
}
