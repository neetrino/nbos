'use client';

import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { EntityDetailSheetsHost } from '@/features/projects/components/EntityDetailSheetsHost';
import { useEntityDetailSheetUrl } from '@/features/projects/hooks/use-entity-detail-sheet-url';
import { productsApi, type FullProduct } from '@/lib/api/products';

function productIdFromDeliveryKey(key: string | null): string | null {
  if (!key?.startsWith('product-')) return null;
  const id = key.slice('product-'.length).trim();
  return id || null;
}

interface WorkSpacesEntitySheetsHostProps {
  sheetProduct: FullProduct | null;
  onSheetProductChange: (product: FullProduct | null) => void;
}

/** Delivery and deal sheets for Work Spaces cards (lazy product load for delivery drawer). */
export function WorkSpacesEntitySheetsHost({
  sheetProduct,
  onSheetProductChange,
}: WorkSpacesEntitySheetsHostProps) {
  const { openDeliveryItemKey } = useEntityDetailSheetUrl();
  const deliveryProductId = productIdFromDeliveryKey(openDeliveryItemKey);

  useEffect(() => {
    if (!deliveryProductId) {
      onSheetProductChange(null);
      return;
    }
    if (sheetProduct?.id === deliveryProductId) return;

    let cancelled = false;
    void productsApi
      .getById(deliveryProductId)
      .then((loaded) => {
        if (!cancelled) onSheetProductChange(loaded);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Product could not be loaded for the delivery sheet.');
          onSheetProductChange(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deliveryProductId, sheetProduct?.id, onSheetProductChange]);

  const refreshProduct = useCallback(async () => {
    if (!deliveryProductId) return;
    try {
      const loaded = await productsApi.getById(deliveryProductId);
      onSheetProductChange(loaded);
    } catch {
      toast.error('Product could not be refreshed.');
    }
  }, [deliveryProductId, onSheetProductChange]);

  return (
    <EntityDetailSheetsHost
      product={sheetProduct}
      allowPendingDeliveryKey
      onEntityUpdated={() => void refreshProduct()}
    />
  );
}

export async function loadWorkSpaceProductForSheets(productId: string): Promise<FullProduct> {
  return productsApi.getById(productId);
}
