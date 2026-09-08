import type { NavigableEntityCardBadge } from '@/components/shared/NavigableEntityCard';
import {
  formatDeliveryLifecycleLabel,
  getDeliveryLifecycleVariant,
  getProductStatus,
} from '@/features/projects/constants/projects';
import type { ProjectProductSummary } from '@/lib/api/projects';

export function getProductDirectoryBadge(
  product: ProjectProductSummary,
): NavigableEntityCardBadge | null {
  if (product.hubView === 'maintenance') {
    return { label: 'Maintenance', variant: 'green' };
  }
  if (product.hubView === 'closed') {
    const cancelled = product.deliveryLifecycle?.resolution === 'CANCELLED';
    return { label: cancelled ? 'Cancelled' : 'Done', variant: cancelled ? 'red' : 'green' };
  }
  if (product.deliveryLifecycle) {
    return {
      label: formatDeliveryLifecycleLabel(product.deliveryLifecycle),
      variant: getDeliveryLifecycleVariant(product.deliveryLifecycle),
    };
  }
  const status = getProductStatus(product.status);
  if (!status) return null;
  return { label: status.label, variant: status.variant };
}
