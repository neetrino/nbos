import { BadRequestException } from '@nestjs/common';
import { PrismaClient, type ProductStatusEnum, type TransactionClient } from '@nbos/database';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';
import { stampDeliveryEarnedPeriodForProduct } from '../../delivery-compensation/stamp-delivery-earned-period';
import { stampDeliveryScopeLockForProduct } from '../../delivery-compensation/stamp-delivery-scope-lock';
import { lockDeliveryConfigurationForProduct } from '../../delivery-compensation/lock-delivery-configuration';
import { materializeInitialDeliveryPlanIfNeeded } from '../../delivery-compensation/materialize-initial-delivery-plan';
import type { NotificationService } from '../../notifications/notification.service';
import type { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import type { PartnerAccrualSubscriptionService } from '../../finance/partner-accrual/partner-accrual-subscription.service';
import type { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import type { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import { buildDeliveryLifecycleWrite } from '../delivery-lifecycle';
import { validateProductStageGate } from './product-stage-gates';
import { loadMissingRequiredAccessSlotKeys } from './product-done-access-slots';
import { loadUnpricedDeliveryNormativeLabels } from './product-done-delivery-norms';

/**
 * Terminal close of a product. Takes the delivery configuration lock so a scope or money change
 * cannot interleave, and stamps the payroll month of V2 accruals in the same transaction as Done,
 * so a closed delivery can never end up without an earned period.
 */
export async function writeTerminalProductClose<T>(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  target: 'DONE' | 'LOST',
  write: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await lockDeliveryConfigurationForProduct(tx, id);
    const row = await write(tx);
    await stampDeliveryScopeLockForProduct(tx, id);
    if (target === 'DONE') {
      await stampDeliveryEarnedPeriodForProduct(tx, id);
    }
    return row;
  });
}

export async function applyDeliveryOutcomeSideEffects(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  partnerAccrualClassic: PartnerAccrualClassicService,
  partnerAccrualSubscription: PartnerAccrualSubscriptionService,
  productId: string,
  targetStatus: string,
): Promise<void> {
  if (targetStatus !== 'DONE' && targetStatus !== 'LOST') return;
  const linkedOrder = await prisma.order.findUnique({
    where: { productId },
    select: { id: true },
  });
  if (!linkedOrder) return;
  if (targetStatus === 'DONE') {
    await syncProductBonusPoolForOrder(prisma, linkedOrder.id, notifications);
    await partnerAccrualClassic.tryInboundClassicAfterDelivery(linkedOrder.id);
    await partnerAccrualSubscription.releaseHeldAccrualsAfterDelivery(linkedOrder.id);
    return;
  }
  await partnerAccrualSubscription.cancelHeldAccrualsAfterLostDelivery(linkedOrder.id);
}

export async function validateProductStageGateForTarget(
  prisma: InstanceType<typeof PrismaClient>,
  product: Parameters<typeof validateProductStageGate>[0] & {
    id: string;
    productCategory: string;
    productType: string;
  },
  target: ProductStatusEnum,
) {
  if (target !== 'DONE') {
    validateProductStageGate(product, target);
    return;
  }
  const [missingRequiredAccessSlotKeys, unpricedDeliveryNormatives] = await Promise.all([
    loadMissingRequiredAccessSlotKeys(prisma, product),
    loadUnpricedDeliveryNormativeLabels(prisma, product.id),
  ]);
  validateProductStageGate(
    { ...product, missingRequiredAccessSlotKeys, unpricedDeliveryNormatives },
    target,
  );
}

export async function writeProductLifecycle(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  id: string,
  target: ProductStatusEnum,
  product: Parameters<typeof buildDeliveryLifecycleWrite>[1],
  actorId?: string,
) {
  let createdOrderId: string | null = null;
  const updatedProduct = await prisma.$transaction(async (tx) => {
    if (target === 'DONE' || target === 'LOST') {
      await lockDeliveryConfigurationForProduct(tx, id);
    }
    const updated = await tx.product.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, product) },
      include: { project: { select: { id: true, code: true, name: true } } },
    });
    if (target === 'DONE' || target === 'LOST') {
      await stampDeliveryScopeLockForProduct(tx, id);
    }
    if (target === 'DONE') {
      await stampDeliveryEarnedPeriodForProduct(tx, id);
    }
    if (target === 'DEVELOPMENT') {
      const result = await materializeInitialDeliveryPlanIfNeeded(tx, {
        entityKind: 'PRODUCT',
        productId: id,
        actorEmployeeId: actorId,
      });
      if (result.status === 'CREATED') {
        createdOrderId = result.orderId;
      }
    }
    return updated;
  });
  if (createdOrderId) {
    await syncProductBonusPoolForOrder(prisma, createdOrderId, notifications);
  }
  return updatedProduct;
}

export async function validateDevelopmentGate(
  deliveryStageChecklistSync: DeliveryStageChecklistSyncService,
  checklistTemplates: ChecklistTemplatesService,
  product: { id: string; deadline?: Date | string | null },
) {
  if (!product.deadline) {
    throw new BadRequestException({
      statusCode: 400,
      code: 'STAGE_GATE_VALIDATION',
      message: 'Product deadline must be set before Development.',
      errors: [{ field: 'deadline', message: 'Deadline must be set before Development.' }],
    });
  }
  await deliveryStageChecklistSync.syncProductAfterLifecycleWrite(product.id);
  await checklistTemplates.assertStageInstancesCompleted({
    ownerEntityType: 'PRODUCT',
    ownerEntityId: product.id,
    deliveryStage: 'STARTING',
  });
}
