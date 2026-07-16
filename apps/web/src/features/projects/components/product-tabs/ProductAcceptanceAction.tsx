'use client';

import { Handshake, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FullProduct } from '@/lib/api/products';
import { productStageGateFieldClass } from '@/features/projects/product-stage-gate-highlight';

interface ProductAcceptanceActionProps {
  product: FullProduct;
  disabled: boolean;
  error: string | null;
  highlightRequired?: boolean;
  onConfirm: () => void;
}

export function ProductAcceptanceAction({
  product,
  disabled,
  error,
  highlightRequired = false,
  onConfirm,
}: ProductAcceptanceActionProps) {
  const requiredFields = highlightRequired ? new Set(['clientAcceptance']) : new Set<string>();
  if (product.clientAcceptedAt) {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-300">
        Client acceptance recorded
        {product.clientAcceptedBy ? ` by ${product.clientAcceptedBy}` : ''}.
      </p>
    );
  }

  if (
    product.deliveryLifecycle?.isTerminal ||
    product.deliveryLifecycle?.workStatus === 'ON_HOLD'
  ) {
    return null;
  }

  return (
    <div
      className={productStageGateFieldClass(
        requiredFields,
        'clientAcceptance',
        'rounded-xl border border-dashed border-violet-300/80 bg-violet-500/5 p-3.5 transition-[border-color,background-color] hover:border-violet-400/80 hover:bg-violet-500/10',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300">
          <Handshake className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Client acceptance</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Record acceptance after the client approves transfer results.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onConfirm}
        className="mt-3 border-violet-300/80 bg-violet-500/10 text-violet-800 hover:bg-violet-500/15 hover:text-violet-900 dark:text-violet-200"
      >
        <PencilLine className="size-3.5" aria-hidden />
        Record acceptance
      </Button>
      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
