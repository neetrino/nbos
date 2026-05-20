import {
  getProductStageGateErrors,
  PRODUCT_ALLOWED_TRANSITIONS,
  type ProductStageGateInput,
} from '@nbos/shared';
import type { FullProduct } from '@/lib/api/products';
import type { ApiFieldError } from '@/lib/api-errors';

export function getProductNextStatuses(status: string): string[] {
  return PRODUCT_ALLOWED_TRANSITIONS[status] ?? [];
}

export function getLocalProductStageGateErrors(
  product: FullProduct,
  targetStatus: string,
): ApiFieldError[] {
  return getProductStageGateErrors(toProductStageGateInput(product), targetStatus);
}

export function toProductStageGateInput(product: FullProduct): ProductStageGateInput {
  return {
    status: product.status,
    description: product.description,
    deadline: product.deadline,
    clientAcceptedAt: product.clientAcceptedAt,
    order: product.order,
    extensions: product.extensions,
    tasks: product.tasks,
    tickets: product.tickets,
  };
}
