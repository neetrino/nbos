import { extensionsApi } from '@/lib/api/extensions';
import { productsApi } from '@/lib/api/products';
import {
  getItemLifecycle,
  NEXT_DELIVERY_STAGE,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export type BoardAction = 'MOVE_NEXT' | 'RESUME' | 'COMPLETE';

export async function runBoardAction(item: DeliveryBoardItem, action: BoardAction) {
  if (item.kind === 'PRODUCT') return runProductBoardAction(item, action);
  return runExtensionBoardAction(item, action);
}

async function runProductBoardAction(
  item: Extract<DeliveryBoardItem, { kind: 'PRODUCT' }>,
  action: BoardAction,
) {
  if (action === 'RESUME') return productsApi.resume(item.product.id);
  if (action === 'COMPLETE') return productsApi.complete(item.product.id);
  const nextStage = getNextStageOrThrow(item);
  return productsApi.moveStage(item.product.id, { stage: nextStage });
}

async function runExtensionBoardAction(
  item: Extract<DeliveryBoardItem, { kind: 'EXTENSION' }>,
  action: BoardAction,
) {
  if (action === 'RESUME') return extensionsApi.resume(item.extension.id);
  if (action === 'COMPLETE') return extensionsApi.complete(item.extension.id);
  const nextStage = getNextStageOrThrow(item);
  return extensionsApi.moveStage(item.extension.id, { stage: nextStage });
}

function getNextStageOrThrow(item: DeliveryBoardItem) {
  const currentStage = getItemLifecycle(item)?.stage;
  if (!currentStage || !NEXT_DELIVERY_STAGE[currentStage]) {
    throw new Error('No next delivery stage is available.');
  }
  return NEXT_DELIVERY_STAGE[currentStage];
}
