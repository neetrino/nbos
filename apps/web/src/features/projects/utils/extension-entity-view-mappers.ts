import type { ProjectExtensionSummary } from '@/lib/api/projects';
import type { ProductExtensionRef } from '@/lib/api/products';
import type { ExtensionEntityViewModel } from '@/features/projects/utils/extension-entity-view-model';
import { getEntityOrderDealId } from '@/features/projects/utils/entity-order-deal';

export function projectExtensionToViewModel(
  extension: ProjectExtensionSummary,
): ExtensionEntityViewModel {
  return {
    id: extension.id,
    name: extension.name,
    size: extension.size,
    status: extension.status,
    assignee: extension.assignee,
    productId: extension.productId,
    productName: extension.product.name,
    taskCount: extension._count.tasks,
    deliveryLifecycle: extension.deliveryLifecycle,
    dealId: getEntityOrderDealId(extension.order),
  };
}

export function productExtensionToViewModel(
  extension: ProductExtensionRef,
  productId: string,
): ExtensionEntityViewModel {
  return {
    id: extension.id,
    name: extension.name,
    size: extension.size,
    status: extension.status,
    assignee: extension.assignee,
    createdAt: extension.createdAt,
    productId,
    dealId: getEntityOrderDealId(extension.order),
  };
}
