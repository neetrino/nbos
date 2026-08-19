'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DeliveryItemDetailSheet } from '@/features/projects/components/delivery-board/DeliveryItemDetailSheet';
import { productToDeliveryBoardItem } from '@/features/projects/components/delivery-board/delivery-board-item-adapters';
import type { DeliveryBoardItem } from '@/features/projects/components/delivery-board/project-delivery-board-model';
import { useDeliveryBoardMutations } from '@/features/projects/components/delivery-board/use-delivery-board-mutations';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import { productsApi } from '@/lib/api/products';
import { getApiErrorMessage } from '@/lib/api-errors';

interface GlobalSearchProductSheetProps {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchProductSheet({
  productId,
  open,
  onOpenChange,
}: GlobalSearchProductSheetProps) {
  const { persistedValue: renderProductId, onOpenChangeComplete: clearRenderProductId } =
    useSheetPersistedValue(productId);
  const hostMounted = useSheetHostMounted(open, renderProductId);

  const [item, setItem] = useState<DeliveryBoardItem | null>(null);

  useEffect(() => {
    if (!open || !renderProductId) return;

    let cancelled = false;
    void productsApi
      .getById(renderProductId)
      .then((loaded) => {
        if (!cancelled) setItem(productToDeliveryBoardItem(loaded));
      })
      .catch((caught) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(caught, 'Product not found or you cannot open it.'));
          onOpenChange(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [renderProductId, onOpenChange, open]);

  const refreshProduct = useCallback(async () => {
    if (!renderProductId) return;
    try {
      const loaded = await productsApi.getById(renderProductId);
      setItem(productToDeliveryBoardItem(loaded));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Product could not be refreshed.'));
    }
  }, [renderProductId]);

  const boardMutations = useDeliveryBoardMutations(refreshProduct);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        clearRenderProductId(false);
        setItem(null);
      }
    },
    [clearRenderProductId, onOpenChange],
  );

  if (!hostMounted) return null;

  return (
    <DeliveryItemDetailSheet
      item={item}
      open={open}
      onOpenChange={handleOpenChange}
      onEntityUpdated={() => void refreshProduct()}
      onTitleSaved={(nextItem) => setItem(nextItem)}
      boardMutations={boardMutations}
    />
  );
}
