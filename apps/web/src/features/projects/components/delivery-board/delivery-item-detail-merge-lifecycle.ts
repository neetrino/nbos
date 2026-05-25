import type { DeliveryLifecycleProjection } from '@/lib/api/projects';
import type { FullExtension } from '@/lib/api/extensions';
import type { FullProduct } from '@/lib/api/products';
import type { DeliveryBoardItem } from './project-delivery-board-model';

/**
 * Prefer full entity from API; merge list `currentStageReadiness` when detail payload omits it.
 */
export function mergeDeliveryDetailLifecycle(
  item: DeliveryBoardItem,
  fullProduct: FullProduct | null,
  fullExtension: FullExtension | null,
): DeliveryLifecycleProjection | undefined {
  const listLc =
    item.kind === 'PRODUCT' ? item.product.deliveryLifecycle : item.extension.deliveryLifecycle;
  const fullLc =
    item.kind === 'PRODUCT' ? fullProduct?.deliveryLifecycle : fullExtension?.deliveryLifecycle;
  const base = fullLc ?? listLc;
  if (!base) return undefined;
  return {
    ...base,
    currentStageReadiness: fullLc?.currentStageReadiness ?? listLc?.currentStageReadiness,
  };
}
