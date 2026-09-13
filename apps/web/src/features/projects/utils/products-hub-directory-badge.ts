import type { NavigableEntityCardBadge } from '@/components/shared/NavigableEntityCard';
import {
  translateDeliveryLifecycleLabel,
  type DeliveryBoardTranslate,
} from '@/features/projects/components/delivery-board/delivery-board-message-keys';
import {
  getDeliveryLifecycleVariant,
  getProductStatus,
} from '@/features/projects/constants/projects';
import type { ProjectProductSummary } from '@/lib/api/projects';

export function getProductDirectoryBadge(
  product: ProjectProductSummary,
  t: DeliveryBoardTranslate,
): NavigableEntityCardBadge | null {
  if (product.hubView === 'maintenance') {
    return { label: t('hub.maintenance'), variant: 'green' };
  }
  if (product.hubView === 'closed') {
    const cancelled = product.deliveryLifecycle?.resolution === 'CANCELLED';
    return {
      label: cancelled ? t('resolution.cancelled') : t('resolution.done'),
      variant: cancelled ? 'red' : 'green',
    };
  }
  if (product.deliveryLifecycle) {
    return {
      label: translateDeliveryLifecycleLabel(product.deliveryLifecycle, t),
      variant: getDeliveryLifecycleVariant(product.deliveryLifecycle),
    };
  }
  const status = getProductStatus(product.status);
  if (!status) return null;
  return { label: status.label, variant: status.variant };
}
