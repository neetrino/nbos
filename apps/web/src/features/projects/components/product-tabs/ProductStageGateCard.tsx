'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { FullProduct } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import { type ApiFieldError, isStageGateApiError } from '@/lib/api-errors';
import { PRODUCT_STATUSES } from '@/features/projects/constants/projects';
import { resolveBlockerDirectActions } from '@/features/shared/blocker-actions';
import {
  getLocalProductStageGateErrors,
  getProductNextStatuses,
} from '@/features/projects/product-stage-gate-client';
import {
  resolveProductTabFromBlockerActionKey,
  splitProductStageGateErrors,
} from '@/features/projects/product-stage-gate-highlight';
import {
  DeliveryLifecycleActionDialog,
  type DeliveryLifecycleAction,
  type DeliveryLifecycleActionPayload,
} from '@/features/projects/components/DeliveryLifecycleActionDialog';
import { ProductLifecycleActions } from './ProductLifecycleActions';
import { ProductAcceptanceAction } from './ProductAcceptanceAction';
import { ProductDoneReadinessPanel } from './ProductDoneReadinessPanel';
import { ProductStageGateSummary } from './ProductStageGateSummary';
import type { ProductTabForGate } from '@/features/projects/product-stage-gate-highlight';
import type { SheetStageGateHighlight } from '@/lib/stage-gate-highlight';

const PRODUCT_STAGE_BY_STATUS: Record<string, 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER'> = {
  NEW: 'STARTING',
  CREATING: 'STARTING',
  DEVELOPMENT: 'DEVELOPMENT',
  QA: 'QA',
  TRANSFER: 'TRANSFER',
};

interface ProductStageGateCardProps {
  product: FullProduct;
  gateRequiredFields: ReadonlySet<string>;
  stageGateHighlight: SheetStageGateHighlight | null;
  onStatusChange: () => void;
  onStageGateBlocked: (errors: ApiFieldError[]) => void;
  onStageGateClear: () => void;
  onNavigateTab: (tab: ProductTabForGate) => void;
}

export function ProductStageGateCard({
  product,
  gateRequiredFields,
  stageGateHighlight,
  onStatusChange,
  onStageGateBlocked,
  onStageGateClear,
  onNavigateTab,
}: ProductStageGateCardProps) {
  const [updating, setUpdating] = useState(false);
  const [dialogAction, setDialogAction] = useState<DeliveryLifecycleAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptanceError, setAcceptanceError] = useState<string | null>(null);
  const nextStatuses = getProductNextStatuses(product.status);

  const handleStatusChange = async (newStatus: string) => {
    const localErrors = getLocalProductStageGateErrors(product, newStatus);
    if (localErrors.length > 0) {
      onStageGateBlocked(localErrors);
      return;
    }

    setUpdating(true);
    onStageGateClear();
    try {
      const stage = PRODUCT_STAGE_BY_STATUS[newStatus];
      if (stage) {
        await productsApi.moveStage(product.id, { stage });
      } else if (newStatus === 'DONE') {
        await productsApi.complete(product.id);
      } else {
        throw new Error(`Unsupported product lifecycle target: ${newStatus}`);
      }
      onStatusChange();
    } catch (error) {
      if (isStageGateApiError(error)) {
        onStageGateBlocked(error.errors);
        return;
      }
      onStageGateBlocked([
        {
          field: 'status',
          message: error instanceof Error ? error.message : 'Failed to update product status.',
        },
      ]);
    } finally {
      setUpdating(false);
    }
  };

  const handleResume = async () => {
    setUpdating(true);
    setActionError(null);
    try {
      await productsApi.resume(product.id);
      onStageGateClear();
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
      onStageGateClear();
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
      onStageGateClear();
      onStatusChange();
    } catch (error) {
      setActionError(toActionError(error, 'Failed to update product delivery.'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 text-sm font-semibold">Stage Gate</h3>
      <ProductStageGateSummary product={product} nextStatuses={nextStatuses} />
      <ProductDoneReadinessPanel readiness={product.doneReadiness} />
      <ProductAcceptanceAction
        product={product}
        disabled={updating}
        error={acceptanceError}
        highlightRequired={gateRequiredFields.has('clientAcceptance')}
        onConfirm={handleConfirmAcceptance}
      />
      <ProductStageActions
        status={product.status}
        nextStatuses={nextStatuses}
        updating={updating}
        onStatusChange={handleStatusChange}
      />
      <ProductLifecycleActions
        product={product}
        disabled={updating}
        onPause={() => setDialogAction('pause')}
        onResume={handleResume}
        onCancel={() => setDialogAction('cancel')}
      />
      <ProductStageGateActionBlockers
        highlight={stageGateHighlight}
        onNavigateTab={onNavigateTab}
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
    </section>
  );
}

function ProductStageGateActionBlockers({
  highlight,
  onNavigateTab,
}: {
  highlight: SheetStageGateHighlight | null;
  onNavigateTab: (tab: ProductTabForGate) => void;
}) {
  if (!highlight) return null;

  const { actionBlockers } = splitProductStageGateErrors(highlight.errors);
  if (actionBlockers.length === 0) return null;

  const directActions = resolveBlockerDirectActions({ context: 'product', errors: actionBlockers });

  return (
    <div className="border-destructive/30 bg-destructive/5 mt-4 space-y-2 rounded-xl border p-3">
      <p className="text-destructive text-xs font-semibold">Action required</p>
      <ul className="text-muted-foreground space-y-1 text-xs">
        {actionBlockers.map((error) => (
          <li key={error.field}>{error.message || `Resolve ${error.field}.`}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        {directActions.map((action) => (
          <Button
            key={action.key}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onNavigateTab(resolveProductTabFromBlockerActionKey(action.key))}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ProductStageActions({
  status,
  nextStatuses,
  updating,
  onStatusChange,
}: {
  status: string;
  nextStatuses: string[];
  updating: boolean;
  onStatusChange: (status: string) => void;
}) {
  if (nextStatuses.length === 0) {
    return <p className="text-muted-foreground text-sm">{getNoTransitionMessage(status)}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">Move product to the next stage:</p>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((nextStatus) => (
          <StageButton
            key={nextStatus}
            status={nextStatus}
            disabled={updating}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

function StageButton({
  status,
  disabled,
  onStatusChange,
}: {
  status: string;
  disabled: boolean;
  onStatusChange: (status: string) => void;
}) {
  const option = PRODUCT_STATUSES.find((item) => item.value === status);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={() => onStatusChange(status)}
      className="gap-1.5"
    >
      <div className={`h-2 w-2 rounded-full ${option?.color ?? 'bg-gray-400'}`} />
      {option?.label ?? status}
    </Button>
  );
}

function toActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getNoTransitionMessage(status: string) {
  if (status === 'DONE') return 'Product is completed.';
  if (status === 'LOST') return 'Product is marked as lost.';
  return 'No available transitions.';
}
