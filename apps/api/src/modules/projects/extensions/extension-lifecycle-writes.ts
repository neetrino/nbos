import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, type ExtensionStatusEnum } from '@nbos/database';
import { syncProductBonusPoolForOrder } from '../../bonus/product-bonus-pool-sync';
import { stampDeliveryEarnedPeriodForExtension } from '../../delivery-compensation/stamp-delivery-earned-period';
import { stampDeliveryScopeLockForExtension } from '../../delivery-compensation/stamp-delivery-scope-lock';
import { lockDeliveryConfigurationForExtension } from '../../delivery-compensation/lock-delivery-configuration';
import { materializeInitialDeliveryPlanIfNeeded } from '../../delivery-compensation/materialize-initial-delivery-plan';
import type { NotificationService } from '../../notifications/notification.service';
import type { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import type { PartnerAccrualSubscriptionService } from '../../finance/partner-accrual/partner-accrual-subscription.service';
import type { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import type { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import { buildDeliveryLifecycleWrite } from '../delivery-lifecycle';

export async function applyDeliveryOutcomeSideEffects(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  partnerAccrualClassic: PartnerAccrualClassicService,
  partnerAccrualSubscription: PartnerAccrualSubscriptionService,
  extensionId: string,
  targetStatus: string,
): Promise<void> {
  if (targetStatus !== 'DONE' && targetStatus !== 'LOST') return;
  const linkedOrder = await prisma.order.findUnique({
    where: { extensionId },
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

export async function writeExtensionLifecycle(
  prisma: InstanceType<typeof PrismaClient>,
  notifications: NotificationService,
  id: string,
  target: ExtensionStatusEnum,
  extension: Parameters<typeof buildDeliveryLifecycleWrite>[1],
  actorId?: string,
) {
  let createdOrderId: string | null = null;
  const updated = await prisma.$transaction(async (tx) => {
    if (target === 'DONE' || target === 'LOST') {
      await lockDeliveryConfigurationForExtension(tx, id);
    }
    const row = await tx.extension.update({
      where: { id },
      data: { status: target, ...buildDeliveryLifecycleWrite(target, extension) },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
      },
    });
    if (target === 'DONE' || target === 'LOST') {
      await stampDeliveryScopeLockForExtension(tx, id);
    }
    if (target === 'DONE') {
      await stampDeliveryEarnedPeriodForExtension(tx, id);
    }
    if (target === 'DEVELOPMENT') {
      const result = await materializeInitialDeliveryPlanIfNeeded(tx, {
        entityKind: 'EXTENSION',
        extensionId: id,
        actorEmployeeId: actorId,
      });
      if (result.status === 'CREATED') {
        createdOrderId = result.orderId;
      }
    }
    return row;
  });
  if (createdOrderId) {
    await syncProductBonusPoolForOrder(prisma, createdOrderId, notifications);
  }
  return updated;
}

export async function writeTerminalExtensionCancel(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  extension: Parameters<typeof buildDeliveryLifecycleWrite>[1],
  reason: string,
  closedAt: Date,
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockDeliveryConfigurationForExtension(tx, id);
    const row = await tx.extension.update({
      where: { id },
      data: {
        status: 'LOST',
        ...buildDeliveryLifecycleWrite('LOST', extension),
        cancellationReason: reason,
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await stampDeliveryScopeLockForExtension(tx, id);
    return row;
  });
}

export async function writeTerminalExtensionComplete(
  prisma: InstanceType<typeof PrismaClient>,
  id: string,
  target: ExtensionStatusEnum,
  extension: Parameters<typeof buildDeliveryLifecycleWrite>[1],
  closedAt: Date,
  actorId: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockDeliveryConfigurationForExtension(tx, id);
    const row = await tx.extension.update({
      where: { id },
      data: {
        status: target,
        ...buildDeliveryLifecycleWrite(target, extension),
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true } },
        order: { select: { id: true, code: true, status: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await stampDeliveryScopeLockForExtension(tx, id);
    await stampDeliveryEarnedPeriodForExtension(tx, id);
    return row;
  });
}

export async function validateDevelopmentGate(
  deliveryStageChecklistSync: DeliveryStageChecklistSyncService,
  checklistTemplates: ChecklistTemplatesService,
  extensionId: string,
) {
  await deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(extensionId);
  await checklistTemplates.assertStageInstancesCompleted({
    ownerEntityType: 'EXTENSION',
    ownerEntityId: extensionId,
    deliveryStage: 'STARTING',
  });
}

export async function ensureProductBelongsToProject(
  prisma: InstanceType<typeof PrismaClient>,
  productId: string,
  projectId: string,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, projectId: true },
  });

  if (!product) throw new NotFoundException(`Product ${productId} not found`);
  if (product.projectId !== projectId) {
    throw new BadRequestException('Extension product must belong to the same project');
  }
}
