'use client';

import { Handshake } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('deliveryBoard');
  const requiredFields = highlightRequired ? new Set(['clientAcceptance']) : new Set<string>();

  if (product.clientAcceptedAt) {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-300">
        {product.clientAcceptedBy
          ? t('acceptance.recordedBy', { name: product.clientAcceptedBy })
          : t('acceptance.recorded')}
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
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        disabled={disabled}
        aria-invalid={highlightRequired || undefined}
        onClick={onConfirm}
        className={productStageGateFieldClass(
          requiredFields,
          'clientAcceptance',
          'h-9 w-full gap-2 rounded-xl bg-violet-600 px-3.5 text-white hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400',
        )}
      >
        <Handshake className="size-4" aria-hidden />
        {t('acceptance.title')}
      </Button>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
