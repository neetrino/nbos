'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { FullProduct } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import { type ApiFieldError, isStageGateApiError } from '@/lib/api-errors';
import { PRODUCT_STATUSES } from '@/features/projects/constants/projects';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CREATING', 'LOST'],
  CREATING: ['DEVELOPMENT', 'ON_HOLD', 'LOST'],
  DEVELOPMENT: ['QA', 'ON_HOLD', 'LOST'],
  QA: ['TRANSFER', 'DEVELOPMENT', 'ON_HOLD'],
  TRANSFER: ['DONE', 'QA'],
  ON_HOLD: ['CREATING', 'DEVELOPMENT'],
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
  const nextStatuses = ALLOWED_TRANSITIONS[product.status] ?? [];

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    setBlocker(null);
    try {
      await productsApi.updateStatus(product.id, newStatus);
      onStatusChange();
    } catch (error) {
      setBlocker(toStageGateBlocker(error));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="bg-card border-border rounded-xl border p-5">
      <h3 className="mb-4 text-sm font-semibold">Stage Gate</h3>
      <ProductStageActions
        status={product.status}
        nextStatuses={nextStatuses}
        updating={updating}
        onStatusChange={handleStatusChange}
      />
      {blocker && <StageGateBlockerPanel blocker={blocker} projectId={product.project.id} />}
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
          <Link
            href={`/projects/${projectId}`}
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-3' })}
          >
            Open Project PM Intake
          </Link>
        </div>
      </div>
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

function getNoTransitionMessage(status: string) {
  if (status === 'DONE') return 'Product is completed.';
  if (status === 'LOST') return 'Product is marked as lost.';
  return 'No available transitions.';
}
