'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  TransitionBlockerDialog,
  type TransitionBlockerAction,
} from '@/features/crm/components/TransitionBlockerDialog';
import {
  resolveBlockerDirectActions,
  type BlockerDirectAction,
} from '@/features/shared/blocker-actions';
import {
  resolveExtensionStageGateActionHref,
  resolveProductStageGateActionHref,
} from '@/features/projects/utils/projects-hub-stage-gate-blocker-hrefs';
import type { DeliveryStageGateResolution } from './delivery-stage-gate-resolution';
import { DELIVERY_STAGE_LABELS } from './project-delivery-board-model';

function buildHref(
  blocker: DeliveryStageGateResolution['blocker'],
  action: Pick<BlockerDirectAction, 'key'>,
): string {
  return blocker.variant === 'product'
    ? resolveProductStageGateActionHref({
        projectId: blocker.projectId,
        productId: blocker.productId,
        action,
      })
    : resolveExtensionStageGateActionHref({
        projectId: blocker.projectId,
        productId: blocker.productId,
        action,
      });
}

function useDeliveryGateActions(
  resolution: DeliveryStageGateResolution | null,
  router: ReturnType<typeof useRouter>,
): TransitionBlockerAction[] {
  return useMemo(() => {
    if (!resolution) return [];
    const { blocker } = resolution;
    const context = blocker.variant === 'product' ? 'product' : 'extension';
    const resolved = resolveBlockerDirectActions({ context, errors: blocker.errors }).map(
      (action) => ({
        key: action.key,
        label: action.label,
        onClick: () => router.push(buildHref(blocker, action)),
      }),
    );
    if (resolved.length > 0) return resolved;
    const fallback: Pick<BlockerDirectAction, 'key' | 'label'> =
      blocker.variant === 'product'
        ? { key: 'pm-intake', label: 'Open product overview' }
        : { key: 'extension-intake', label: 'Open extension on product' };
    return [
      {
        key: fallback.key,
        label: fallback.label,
        onClick: () => router.push(buildHref(blocker, fallback)),
      },
    ];
  }, [resolution, router]);
}

interface DeliveryBoardStageGateDialogProps {
  resolution: DeliveryStageGateResolution | null;
  onOpenChange: (open: boolean) => void;
  onRetry: () => Promise<void>;
  onOpenDetails: (item: DeliveryStageGateResolution['item']) => void;
}

export function DeliveryBoardStageGateDialog({
  resolution,
  onOpenChange,
  onRetry,
  onOpenDetails,
}: DeliveryBoardStageGateDialogProps) {
  const router = useRouter();
  const directActions = useDeliveryGateActions(resolution, router);
  if (!resolution) return null;

  const blockerState = {
    item: resolution.item,
    targetStatus: resolution.targetStage,
    targetLabel: DELIVERY_STAGE_LABELS[resolution.targetStage],
    errors: resolution.blocker.errors,
    message: resolution.blocker.message,
  };

  return (
    <TransitionBlockerDialog
      open
      blocker={blockerState}
      entityLabel="Delivery item"
      itemLabel={resolution.blocker.itemLabel}
      onOpenChange={onOpenChange}
      onOpenDetails={() => {
        if (resolution) onOpenDetails(resolution.item);
      }}
      onRetry={onRetry}
      directActions={directActions}
    />
  );
}
