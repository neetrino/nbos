'use client';

import { useState } from 'react';
import type { FullProduct } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import {
  DeliveryLifecycleActionDialog,
  type DeliveryLifecycleAction,
  type DeliveryLifecycleActionPayload,
} from '@/features/projects/components/DeliveryLifecycleActionDialog';
import { ProductLifecycleActions } from './ProductLifecycleActions';
import { ProductAcceptanceAction } from './ProductAcceptanceAction';
import { ProductDoneReadinessPanel } from './ProductDoneReadinessPanel';
import { DeliveryStageTimelineStrip } from './DeliveryStageTimelineCard';
import { OverviewPanel } from './product-overview-ui';

interface ProductStageGateCardProps {
  product: FullProduct;
  gateRequiredFields: ReadonlySet<string>;
  onStatusChange: () => void;
}

export function ProductStageGateCard({
  product,
  gateRequiredFields,
  onStatusChange,
}: ProductStageGateCardProps) {
  const [updating, setUpdating] = useState(false);
  const [dialogAction, setDialogAction] = useState<DeliveryLifecycleAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptanceError, setAcceptanceError] = useState<string | null>(null);
  const lifecycle = product.deliveryLifecycle;

  const handleResume = async () => {
    setUpdating(true);
    setActionError(null);
    try {
      await productsApi.resume(product.id);
      onStatusChange();
    } catch (error) {
      setActionError(toActionError(error, 'Failed to resume product.'));
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmAcceptance = async () => {
    setUpdating(true);
    setAcceptanceError(null);
    try {
      await productsApi.confirmAcceptance(product.id, {});
      onStatusChange();
    } catch (error) {
      setAcceptanceError(toActionError(error, 'Failed to record client acceptance.'));
    } finally {
      setUpdating(false);
    }
  };

  const handleLifecycleAction = async (payload: DeliveryLifecycleActionPayload) => {
    if (!dialogAction) return;
    setUpdating(true);
    setActionError(null);
    try {
      if (dialogAction === 'pause') {
        await productsApi.pause(product.id, {
          reason: payload.reason,
          onHoldUntil: payload.onHoldUntil ?? '',
        });
      } else {
        await productsApi.cancel(product.id, { reason: payload.reason });
      }
      setDialogAction(null);
      onStatusChange();
    } catch (error) {
      setActionError(toActionError(error, 'Failed to update product delivery.'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <OverviewPanel
      title="Stage Gate"
      hint="Delivery pipeline, readiness checks, and lifecycle controls"
      bodyClassName="space-y-3"
    >
      {lifecycle ? <DeliveryStageTimelineStrip lifecycle={lifecycle} /> : null}
      <ProductDoneReadinessPanel readiness={product.doneReadiness} compact />
      <ProductAcceptanceAction
        product={product}
        disabled={updating}
        error={acceptanceError}
        highlightRequired={gateRequiredFields.has('clientAcceptance')}
        onConfirm={handleConfirmAcceptance}
      />
      <ProductLifecycleActions
        product={product}
        disabled={updating}
        onPause={() => setDialogAction('pause')}
        onResume={handleResume}
        onCancel={() => setDialogAction('cancel')}
      />
      <DeliveryLifecycleActionDialog
        action={dialogAction}
        entityLabel={product.name}
        isSubmitting={updating}
        error={actionError}
        onOpenChange={(open) => {
          setDialogAction(open ? dialogAction : null);
          setActionError(null);
        }}
        onConfirm={handleLifecycleAction}
      />
    </OverviewPanel>
  );
}

function toActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
