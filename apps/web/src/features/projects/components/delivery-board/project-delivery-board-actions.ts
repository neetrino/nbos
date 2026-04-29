import { extensionsApi } from '@/lib/api/extensions';
import { productsApi } from '@/lib/api/products';
import { type DeliveryLifecycleActionPayload } from '@/features/projects/components/DeliveryLifecycleActionDialog';
import {
  getItemLifecycle,
  NEXT_DELIVERY_STAGE,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export type BoardAction = 'MOVE_NEXT' | 'RESUME' | 'COMPLETE' | 'CANCEL';

export async function runBoardAction(
  item: DeliveryBoardItem,
  action: BoardAction,
  payload?: DeliveryLifecycleActionPayload,
) {
  if (item.kind === 'PRODUCT') return runProductBoardAction(item, action, payload);
  return runExtensionBoardAction(item, action, payload);
}

async function runProductBoardAction(
  item: Extract<DeliveryBoardItem, { kind: 'PRODUCT' }>,
  action: BoardAction,
  payload?: DeliveryLifecycleActionPayload,
) {
  if (action === 'RESUME') return productsApi.resume(item.product.id);
  if (action === 'COMPLETE') return productsApi.complete(item.product.id);
  if (action === 'CANCEL')
    return productsApi.cancel(item.product.id, requireCancelPayload(payload));
  const nextStage = getNextStageOrThrow(item);
  return productsApi.moveStage(item.product.id, { stage: nextStage });
}

async function runExtensionBoardAction(
  item: Extract<DeliveryBoardItem, { kind: 'EXTENSION' }>,
  action: BoardAction,
  payload?: DeliveryLifecycleActionPayload,
) {
  if (action === 'RESUME') return extensionsApi.resume(item.extension.id);
  if (action === 'COMPLETE') return extensionsApi.complete(item.extension.id);
  if (action === 'CANCEL')
    return extensionsApi.cancel(item.extension.id, requireCancelPayload(payload));
  const nextStage = getNextStageOrThrow(item);
  return extensionsApi.moveStage(item.extension.id, { stage: nextStage });
}

function requireCancelPayload(payload: DeliveryLifecycleActionPayload | undefined) {
  if (!payload?.reason) throw new Error('Cancel reason is required.');
  return { reason: payload.reason };
}

function getNextStageOrThrow(item: DeliveryBoardItem) {
  const currentStage = getItemLifecycle(item)?.stage;
  if (!currentStage || !NEXT_DELIVERY_STAGE[currentStage]) {
    throw new Error('No next delivery stage is available.');
  }
  return NEXT_DELIVERY_STAGE[currentStage];
}
