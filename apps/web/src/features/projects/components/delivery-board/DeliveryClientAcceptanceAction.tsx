'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FullProduct } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import { ProductAcceptanceAction } from '../product-tabs/ProductAcceptanceAction';

interface DeliveryClientAcceptanceActionProps {
  product: FullProduct;
  highlightRequired: boolean;
  onRecorded: () => void;
}

/** Records client acceptance so the Transfer → Done gate can close. */
export function DeliveryClientAcceptanceAction({
  product,
  highlightRequired,
  onRecorded,
}: DeliveryClientAcceptanceActionProps) {
  const t = useTranslations('deliveryBoard');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (product.clientAcceptedAt) return null;

  const handleConfirm = async () => {
    setUpdating(true);
    setError(null);
    try {
      await productsApi.confirmAcceptance(product.id, {});
      onRecorded();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('errors.acceptanceFailed'));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ProductAcceptanceAction
      product={product}
      disabled={updating}
      error={error}
      highlightRequired={highlightRequired}
      onConfirm={() => {
        void handleConfirm();
      }}
    />
  );
}
