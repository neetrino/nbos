'use client';

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
      <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">
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
        'mt-3 rounded-xl border border-dashed p-3',
      )}
    >
      <p className="text-sm font-medium">Client acceptance</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Record acceptance after the client approves transfer results.
      </p>
      <Button variant="outline" size="sm" disabled={disabled} onClick={onConfirm} className="mt-3">
        Record acceptance
      </Button>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
