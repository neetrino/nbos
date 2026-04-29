'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { FullProduct } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import { type ApiFieldError, isStageGateApiError } from '@/lib/api-errors';
import { PRODUCT_STATUSES } from '@/features/projects/constants/projects';
import { resolveBlockerDirectActions } from '@/features/shared/blocker-actions';
import {
  DeliveryLifecycleActionDialog,
  type DeliveryLifecycleAction,
  type DeliveryLifecycleActionPayload,
} from '@/features/projects/components/DeliveryLifecycleActionDialog';
import { ProductLifecycleActions } from './ProductLifecycleActions';
import { ProductStageGateSummary } from './ProductStageGateSummary';

const PRODUCT_STAGE_BY_STATUS: Record<string, 'STARTING' | 'DEVELOPMENT' | 'QA' | 'TRANSFER'> = {
  NEW: 'STARTING',
  CREATING: 'STARTING',
  DEVELOPMENT: 'DEVELOPMENT',
  QA: 'QA',
  TRANSFER: 'TRANSFER',
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CREATING'],
  CREATING: ['DEVELOPMENT'],
  DEVELOPMENT: ['QA'],
  QA: ['TRANSFER', 'DEVELOPMENT'],
  TRANSFER: ['DONE', 'QA'],
  ON_HOLD: [],
  DONE: [],
  LOST: [],
};

interface StageGateBlocker {
  message: string;
  errors: ApiFieldError[];
}

interface ProductStageGateCardProps {
  product: FullProduct;
  onStatusChange: () => void;
}

export function ProductStageGateCard({ product, onStatusChange }: ProductStageGateCardProps) {
  const [updating, setUpdating] = useState(false);
  const [blocker, setBlocker] = useState<StageGateBlocker | null>(null);
  const [dialogAction, setDialogAction] = useState<DeliveryLifecycleAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const nextStatuses = ALLOWED_TRANSITIONS[product.status] ?? [];

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    setBlocker(null);
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
      setBlocker(toStageGateBlocker(error));
    } finally {
      setUpdating(false);
    }
  };

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
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 text-sm font-semibold">Stage Gate</h3>
      <ProductStageGateSummary product={product} nextStatuses={nextStatuses} />
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
      {blocker && <StageGateBlockerPanel blocker={blocker} projectId={product.project.id} />}
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

function StageGateBlockerPanel({
  blocker,
  projectId,
}: {
  blocker: StageGateBlocker;
  projectId: string;
}) {
  const directActions = resolveBlockerDirectActions({
    context: 'product',
    errors: blocker.errors,
  });

  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {blocker.message}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300">
            {blocker.errors.map((error) => (
              <li key={error.field}>- {error.message}</li>
            ))}
          </ul>
          <ProductBlockerActions actions={directActions} projectId={projectId} />
        </div>
      </div>
    </div>
  );
}

function ProductBlockerActions({
  actions,
  projectId,
}: {
  actions: Array<{ key: string; label: string }>;
  projectId: string;
}) {
  const visibleActions =
    actions.length > 0 ? actions : [{ key: 'pm-intake', label: 'Open PM intake' }];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {visibleActions.map((action) => (
        <Link
          key={action.key}
          href={`/projects/${projectId}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}

function toStageGateBlocker(error: unknown): StageGateBlocker {
  if (isStageGateApiError(error)) {
    return { message: error.message, errors: error.errors };
  }

  return {
    message: error instanceof Error ? error.message : 'Failed to update product status.',
    errors: [],
  };
}

function toActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getNoTransitionMessage(status: string) {
  if (status === 'DONE') return 'Product is completed.';
  if (status === 'LOST') return 'Product is marked as lost.';
  return 'No available transitions.';
}
