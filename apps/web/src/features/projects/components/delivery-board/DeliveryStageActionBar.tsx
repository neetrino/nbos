import { ArrowRight, CheckCircle2, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import {
  NEXT_DELIVERY_STAGE,
  getItemId,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export type DeliveryStageActionBarVariant = 'card' | 'drawer';

interface DeliveryStageActionBarProps {
  variant: DeliveryStageActionBarVariant;
  item: DeliveryBoardItem;
  lifecycle: DeliveryLifecycleProjection | undefined;
  busyItemId: string | null;
  onMoveNext: () => void;
  onResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
  /** Terminal state on card: navigate to product workspace */
  onOpenProduct?: () => void;
}

export function DeliveryStageActionBar({
  variant,
  item,
  lifecycle,
  busyItemId,
  onMoveNext,
  onResume,
  onComplete,
  onCancel,
  onOpenProduct,
}: DeliveryStageActionBarProps) {
  const terminal = Boolean(lifecycle?.isTerminal);
  const disabled = busyItemId === getItemId(item);

  if (terminal) {
    if (variant === 'drawer') {
      return null;
    }
    return (
      <div className="border-border mt-3 flex justify-end border-t pt-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpenProduct}>
          Open <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    );
  }

  const containerClassName =
    variant === 'drawer'
      ? 'border-border flex flex-wrap gap-2 border-t border-dashed px-5 py-3 sm:px-7'
      : 'border-border mt-3 flex flex-wrap justify-end gap-1.5 border-t pt-2';

  const sizeClass = variant === 'drawer' ? 'h-8 text-xs sm:h-7' : 'h-7 text-xs';

  return (
    <div className={containerClassName}>
      {lifecycle?.workStatus === 'ON_HOLD' ? (
        <Button
          variant="secondary"
          size="sm"
          className={sizeClass}
          disabled={disabled}
          onClick={onResume}
        >
          <Play size={12} /> Resume
        </Button>
      ) : (
        <NextStageButton
          variant={variant}
          lifecycle={lifecycle}
          disabled={disabled}
          onMoveNext={onMoveNext}
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        className={sizeClass}
        disabled={disabled}
        onClick={onComplete}
      >
        <CheckCircle2 size={12} /> Done
      </Button>
      <Button
        variant={variant === 'drawer' ? 'ghost' : 'destructive'}
        size="sm"
        className={
          variant === 'drawer' ? `text-destructive hover:text-destructive ${sizeClass}` : sizeClass
        }
        disabled={disabled}
        onClick={onCancel}
      >
        <XCircle size={12} /> Cancel
      </Button>
    </div>
  );
}

function NextStageButton({
  variant,
  lifecycle,
  disabled,
  onMoveNext,
}: {
  variant: DeliveryStageActionBarVariant;
  lifecycle: DeliveryLifecycleProjection | undefined;
  disabled: boolean;
  onMoveNext: () => void;
}) {
  const nextStage = lifecycle?.stage ? NEXT_DELIVERY_STAGE[lifecycle.stage] : null;
  if (!nextStage) return null;

  const sizeClass = variant === 'drawer' ? 'h-8 text-xs sm:h-7' : 'h-7 text-xs';

  return (
    <Button
      variant="outline"
      size="sm"
      className={sizeClass}
      disabled={disabled}
      onClick={onMoveNext}
    >
      Move next
    </Button>
  );
}
