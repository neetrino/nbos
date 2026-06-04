import type { ProjectExtensionSummary } from '@/lib/api/projects';
import type { ProductExtensionRef } from '@/lib/api/products';
import type { ExtensionEntityViewModel } from '@/features/projects/utils/extension-entity-view-model';

export function projectExtensionToViewModel(
  extension: ProjectExtensionSummary,
): ExtensionEntityViewModel {
  return {
    id: extension.id,
    name: extension.name,
    size: extension.size,
    status: extension.status,
    assignee: extension.assignee,
    productName: extension.product.name,
    taskCount: extension._count.tasks,
    deliveryLifecycle: extension.deliveryLifecycle,
  };
}

export function productExtensionToViewModel(
  extension: ProductExtensionRef,
): ExtensionEntityViewModel {
  return {
    id: extension.id,
    name: extension.name,
    size: extension.size,
    status: extension.status,
    assignee: extension.assignee,
    createdAt: extension.createdAt,
  };
}
