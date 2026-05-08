import type { Extension } from '@/lib/api/extensions';
import type { Product } from '@/lib/api/products';
import type { ProjectExtensionSummary, ProjectProductSummary } from '@/lib/api/projects';
import type { DeliveryBoardItem } from './project-delivery-board-model';

const FALLBACK_PRODUCT_TYPE = 'OTHER';
const FALLBACK_STATUS = 'UNKNOWN';

export function productToDeliveryBoardItem(product: Product): DeliveryBoardItem {
  const summary: ProjectProductSummary = {
    id: product.id,
    name: product.name,
    status: product.status,
    productCategory: product.productCategory,
    productType: product.productType,
    deadline: product.deadline,
    pm: product.pm,
    deliveryLifecycle: product.deliveryLifecycle,
    projectId: product.projectId,
    project: product.project,
    updatedAt: product.updatedAt,
    clientAcceptedAt: product.clientAcceptedAt,
    _count: product._count,
    checklistStageProgress: product.checklistStageProgress,
  };
  return { kind: 'PRODUCT', product: summary };
}

export function extensionToDeliveryBoardItem(extension: Extension): DeliveryBoardItem {
  const summary: ProjectExtensionSummary = {
    id: extension.id,
    name: extension.name,
    status: extension.status,
    size: extension.size,
    productId: extension.productId,
    assignee: extension.assignee,
    projectId: extension.projectId,
    project: extension.project,
    product: {
      id: extension.product.id,
      name: extension.product.name,
      productType: extension.product.productType ?? FALLBACK_PRODUCT_TYPE,
      status: FALLBACK_STATUS,
    },
    deliveryLifecycle: extension.deliveryLifecycle,
    updatedAt: extension.updatedAt,
    _count: extension._count,
    checklistStageProgress: extension.checklistStageProgress,
  };
  return { kind: 'EXTENSION', extension: summary };
}

export function mergeDeliveryBoardItems(
  products: Product[],
  extensions: Extension[],
): DeliveryBoardItem[] {
  return [
    ...products.map(productToDeliveryBoardItem),
    ...extensions.map(extensionToDeliveryBoardItem),
  ];
}
