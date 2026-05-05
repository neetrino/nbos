import type { ApiError, ApiFieldError } from '@/lib/api-errors';
import {
  getItemLabel,
  getNavigableProductId,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export interface DeliveryBoardStageGateBlocker {
  variant: 'product' | 'extension';
  projectId: string;
  productId: string;
  itemLabel: string;
  message: string;
  errors: ApiFieldError[];
}

export function toDeliveryBoardActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function toBoardStageGateBlocker(
  item: DeliveryBoardItem,
  projectId: string,
  error: ApiError,
): DeliveryBoardStageGateBlocker {
  return {
    variant: item.kind === 'PRODUCT' ? 'product' : 'extension',
    projectId,
    productId: getNavigableProductId(item),
    itemLabel: getItemLabel(item),
    message: error.message,
    errors: error.errors,
  };
}
