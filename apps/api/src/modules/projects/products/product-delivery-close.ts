import { BadRequestException } from '@nestjs/common';
import { type InputJsonValue, type ProductStatusEnum } from '@nbos/database';
import {
  attachProductDeliveryLifecycle,
  buildDeliveryLifecycleWrite,
  buildDeliveryPauseWrite,
  buildDeliveryResumeWrite,
  productLegacyStatusForStage,
} from '../delivery-lifecycle';
import { validateProductTransition } from './product-stage-gates';
import { findProductById } from './product-detail-read';
import {
  applyDeliveryOutcomeSideEffects,
  validateProductStageGateForTarget,
  writeTerminalProductClose,
} from './product-lifecycle-writes';
import { maybeEnqueueTechnicalSpecialist } from './product-team-side-effects';
import {
  ensureActiveForStageMove,
  ensureNotTerminal,
  parseFutureDate,
  publishProductChanged,
  requireText,
} from './product-delivery-guards';
import type {
  CancelDeliveryDto,
  ConfirmAcceptanceDto,
  PauseDeliveryDto,
  ProductDeliveryCommandDeps,
} from './product-delivery-deps';

export async function pauseProduct(
  deps: ProductDeliveryCommandDeps,
  id: string,
  data: PauseDeliveryDto,
) {
  const product = await findProductById(deps.prisma, id);
  ensureNotTerminal(product.deliveryLifecycle.resolution);
  const reason = requireText(data.reason, 'reason');
  const onHoldUntil = parseFutureDate(data.onHoldUntil, 'onHoldUntil');
  const updatedProduct = await deps.prisma.product.update({
    where: { id },
    data: {
      status: 'ON_HOLD',
      ...buildDeliveryPauseWrite(product, reason, onHoldUntil),
    },
    include: { project: { select: { id: true, code: true, name: true } } },
  });
  await publishProductChanged(deps.deliveryRealtime, updatedProduct.id);
  return attachProductDeliveryLifecycle(updatedProduct);
}

export async function resumeProduct(deps: ProductDeliveryCommandDeps, id: string) {
  const product = await findProductById(deps.prisma, id);
  ensureNotTerminal(product.deliveryLifecycle.resolution);
  if (product.deliveryLifecycle.workStatus !== 'ON_HOLD') {
    throw new BadRequestException('Product is not on hold');
  }
  const nextStatus = productLegacyStatusForStage(product.deliveryLifecycle.stage);
  const updatedProduct = await deps.prisma.product.update({
    where: { id },
    data: { status: nextStatus as ProductStatusEnum, ...buildDeliveryResumeWrite(product) },
    include: { project: { select: { id: true, code: true, name: true } } },
  });
  await deps.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(updatedProduct.id);
  await maybeEnqueueTechnicalSpecialist(
    deps.productWhatsApp,
    deps.logger,
    updatedProduct,
    nextStatus as ProductStatusEnum,
    undefined,
  );
  await publishProductChanged(deps.deliveryRealtime, updatedProduct.id);
  return attachProductDeliveryLifecycle(updatedProduct);
}

export async function cancelProduct(
  deps: ProductDeliveryCommandDeps,
  id: string,
  data: CancelDeliveryDto,
  actorId: string,
) {
  const product = await findProductById(deps.prisma, id);
  ensureNotTerminal(product.deliveryLifecycle.resolution);
  const reason = requireText(data.reason, 'reason');
  const closedAt = new Date();
  const updatedProduct = await writeTerminalProductClose(deps.prisma, id, 'LOST', (tx) =>
    tx.product.update({
      where: { id },
      data: {
        status: 'LOST',
        ...buildDeliveryLifecycleWrite('LOST', product),
        cancellationReason: reason,
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  );
  await applyDeliveryOutcomeSideEffects(
    deps.prisma,
    deps.notifications,
    deps.partnerAccrualClassic,
    deps.partnerAccrualSubscription,
    id,
    'LOST',
  );
  await deps.audit.log({
    entityType: 'PRODUCT',
    entityId: id,
    action: 'delivery.cancelled',
    userId: actorId,
    projectId: product.projectId,
    changes: { reason } as InputJsonValue,
  });
  await publishProductChanged(deps.deliveryRealtime, updatedProduct.id);
  return attachProductDeliveryLifecycle(updatedProduct);
}

export async function completeProduct(
  deps: ProductDeliveryCommandDeps,
  id: string,
  actorId: string,
) {
  const product = await findProductById(deps.prisma, id);
  ensureActiveForStageMove(product.deliveryLifecycle);
  const target = 'DONE' as ProductStatusEnum;

  validateProductTransition(product.status as ProductStatusEnum, target);
  await validateProductStageGateForTarget(deps.prisma, product, target);

  const closedAt = new Date();
  const updatedProduct = await writeTerminalProductClose(deps.prisma, id, 'DONE', (tx) =>
    tx.product.update({
      where: { id },
      data: {
        status: target,
        ...buildDeliveryLifecycleWrite(target, product),
        closedAt,
        closedById: actorId,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        closedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  );
  await applyDeliveryOutcomeSideEffects(
    deps.prisma,
    deps.notifications,
    deps.partnerAccrualClassic,
    deps.partnerAccrualSubscription,
    id,
    target,
  );
  await deps.audit.log({
    entityType: 'PRODUCT',
    entityId: id,
    action: 'delivery.completed',
    userId: actorId,
    projectId: product.projectId,
    changes: { deliveryResolution: 'DONE' } as InputJsonValue,
  });
  await publishProductChanged(deps.deliveryRealtime, updatedProduct.id);
  return attachProductDeliveryLifecycle(updatedProduct);
}

export async function confirmProductAcceptance(
  deps: ProductDeliveryCommandDeps,
  id: string,
  data: ConfirmAcceptanceDto,
) {
  const product = await findProductById(deps.prisma, id);
  ensureNotTerminal(product.deliveryLifecycle.resolution);
  const updatedProduct = await deps.prisma.product.update({
    where: { id },
    data: {
      clientAcceptedAt: new Date(),
      clientAcceptedBy: data.acceptedBy?.trim() || null,
      clientAcceptanceNote: data.note?.trim() || null,
    },
    include: {
      project: { select: { id: true, code: true, name: true } },
    },
  });
  return attachProductDeliveryLifecycle(updatedProduct);
}
