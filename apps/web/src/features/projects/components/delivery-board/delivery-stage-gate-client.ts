import {
  getExtensionStageGateErrors,
  getProductStageGateErrors,
  type ExtensionStageGateInput,
  type ProductStageGateInput,
} from '@nbos/shared';
import type { ApiFieldError } from '@/lib/api-errors';
import type { DeliveryActiveStage } from './project-delivery-board-actions';
import {
  ACTIVE_DELIVERY_STAGES,
  NEXT_DELIVERY_STAGE,
  getItemLifecycle,
  type DeliveryBoardItem,
} from './project-delivery-board-model';

const OPEN_WORK_ITEM_STATUS = 'IN_PROGRESS';

function productLegacyStatusForDeliveryStage(stage: DeliveryActiveStage): string {
  if (stage === 'DEVELOPMENT' || stage === 'QA' || stage === 'TRANSFER') return stage;
  return 'CREATING';
}

function extensionLegacyStatusForDeliveryStage(stage: DeliveryActiveStage): string {
  if (stage === 'DEVELOPMENT' || stage === 'QA' || stage === 'TRANSFER') return stage;
  return 'NEW';
}

function collectDeliveryStagesToTarget(
  item: DeliveryBoardItem,
  target: DeliveryActiveStage,
): DeliveryActiveStage[] {
  const current = getItemLifecycle(item)?.stage;
  if (!current) return [];
  const curI = ACTIVE_DELIVERY_STAGES.indexOf(current);
  const targetI = ACTIVE_DELIVERY_STAGES.indexOf(target);
  if (curI < 0 || targetI < 0 || curI >= targetI) return [];
  return ACTIVE_DELIVERY_STAGES.slice(curI + 1, targetI + 1);
}

function openItemsFromCount(count: number): Array<{ status: string }> {
  return count > 0 ? [{ status: OPEN_WORK_ITEM_STATUS }] : [];
}

function toProductGateInput(
  item: Extract<DeliveryBoardItem, { kind: 'PRODUCT' }>,
): ProductStageGateInput {
  const product = item.product;
  return {
    status: product.status,
    description: product.description ?? null,
    deadline: product.deadline,
    clientAcceptedAt: product.clientAcceptedAt ?? null,
    order: product.order ?? null,
    extensions: openItemsFromCount(product._count.extensions),
    tasks: openItemsFromCount(product._count.tasks),
    tickets: openItemsFromCount(product._count.tickets),
  };
}

function toExtensionGateInput(
  item: Extract<DeliveryBoardItem, { kind: 'EXTENSION' }>,
): ExtensionStageGateInput {
  const extension = item.extension;
  return {
    status: extension.status,
    description: extension.description ?? null,
    assignedTo: extension.assignedTo ?? null,
    order: extension.order ?? null,
    tasks: openItemsFromCount(extension._count.tasks),
  };
}

function getLegacyGateErrors(item: DeliveryBoardItem, legacyTarget: string): ApiFieldError[] {
  if (item.kind === 'PRODUCT') {
    return getProductStageGateErrors(toProductGateInput(item), legacyTarget);
  }
  return getExtensionStageGateErrors(toExtensionGateInput(item), legacyTarget);
}

function legacyStatusForDeliveryStage(item: DeliveryBoardItem, stage: DeliveryActiveStage): string {
  return item.kind === 'PRODUCT'
    ? productLegacyStatusForDeliveryStage(stage)
    : extensionLegacyStatusForDeliveryStage(stage);
}

/** Local pre-check for drag/advance; API remains authoritative (checklist, full relations). */
export function getLocalDeliveryMoveStageErrors(
  item: DeliveryBoardItem,
  targetDeliveryStage: DeliveryActiveStage,
): ApiFieldError[] {
  for (const stage of collectDeliveryStagesToTarget(item, targetDeliveryStage)) {
    const errors = getLegacyGateErrors(item, legacyStatusForDeliveryStage(item, stage));
    if (errors.length > 0) return errors;
  }
  return [];
}

export function getLocalDeliveryMoveNextErrors(item: DeliveryBoardItem): ApiFieldError[] {
  const current = getItemLifecycle(item)?.stage;
  if (!current) return [];
  const next = NEXT_DELIVERY_STAGE[current];
  if (!next) return [];
  return getLocalDeliveryMoveStageErrors(item, next);
}

export function getLocalDeliveryCompleteErrors(item: DeliveryBoardItem): ApiFieldError[] {
  return getLegacyGateErrors(item, 'DONE');
}
