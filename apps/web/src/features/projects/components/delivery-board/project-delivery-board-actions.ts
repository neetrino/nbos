import { extensionsApi } from '@/lib/api/extensions';
import { productsApi } from '@/lib/api/products';
import { type DeliveryLifecycleActionPayload } from '@/features/projects/components/DeliveryLifecycleActionDialog';
import {
  ACTIVE_DELIVERY_STAGES,
  getItemId,
  getItemLifecycle,
  NEXT_DELIVERY_STAGE,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

export type BoardAction = 'MOVE_NEXT' | 'RESUME' | 'COMPLETE' | 'CANCEL';

export type DeliveryActiveStage = (typeof ACTIVE_DELIVERY_STAGES)[number];

const MAX_STAGE_ADVANCE_STEPS = 8;

/**
 * Moves forward along the delivery pipeline until `target` is reached (or server rejects a gate).
 */
export async function advanceDeliveryItemToStage(
  item: DeliveryBoardItem,
  target: DeliveryActiveStage,
): Promise<void> {
  const id = getItemId(item);
  const isProduct = item.kind === 'PRODUCT';

  for (let step = 0; step < MAX_STAGE_ADVANCE_STEPS; step++) {
    const entity = isProduct ? await productsApi.getById(id) : await extensionsApi.getById(id);
    const lc = entity.deliveryLifecycle;
    if (!lc || lc.isTerminal) {
      return;
    }
    if (lc.workStatus === 'ON_HOLD') {
      throw new Error('Resume delivery before changing stages.');
    }
    const cur = lc.stage;
    if (!cur || cur === target) {
      return;
    }

    const curI = ACTIVE_DELIVERY_STAGES.indexOf(cur);
    const targetI = ACTIVE_DELIVERY_STAGES.indexOf(target);
    if (curI < 0 || targetI < 0 || curI >= targetI) {
      return;
    }

    const next = NEXT_DELIVERY_STAGE[cur];
    if (!next || ACTIVE_DELIVERY_STAGES.indexOf(next) > targetI) {
      throw new Error('Cannot move to that stage.');
    }

    if (isProduct) {
      await productsApi.moveStage(id, { stage: next });
    } else {
      await extensionsApi.moveStage(id, { stage: next });
    }
  }

  throw new Error('Stage advance exceeded maximum steps.');
}

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
