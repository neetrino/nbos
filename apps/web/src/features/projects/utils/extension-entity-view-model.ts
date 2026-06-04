import type { DeliveryLifecycleProjection } from '@/lib/api/projects';

export interface ExtensionEntityViewModel {
  id: string;
  name: string;
  size: string;
  status: string;
  assignee: { firstName: string; lastName: string } | null;
  productId?: string;
  productName?: string;
  taskCount?: number;
  deliveryLifecycle?: DeliveryLifecycleProjection;
  createdAt?: string;
  dealId?: string | null;
}
