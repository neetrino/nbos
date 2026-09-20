import { BadRequestException } from '@nestjs/common';
import { type InputJsonValue, type ProductStatusEnum } from '@nbos/database';
import {
  DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
  isLegacyPatchStatusTerminalOutcome,
} from '../delivery-status-deprecation';
import { attachProductDeliveryLifecycle, productLegacyStatusForStage } from '../delivery-lifecycle';
import { PRODUCT_STATUS_ORDER, validateProductTransition } from './product-stage-gates';
import { findProductById } from './product-detail-read';
import {
  applyDeliveryOutcomeSideEffects,
  validateDevelopmentGate,
  validateProductStageGateForTarget,
  writeProductLifecycle,
} from './product-lifecycle-writes';
import { maybeEnqueueTechnicalSpecialist } from './product-team-side-effects';
import {
  ensureActiveForStageMove,
  parseDeliveryStage,
  publishProductChanged,
} from './product-delivery-guards';
import type { MoveStageDto, ProductDeliveryCommandDeps } from './product-delivery-deps';

export async function updateProductStatus(
  deps: ProductDeliveryCommandDeps,
  id: string,
  newStatus: string,
  actorId: string,
) {
  const product = await findProductById(deps.prisma, id);
  const current = product.status as ProductStatusEnum;
  const target = newStatus as ProductStatusEnum;

  if (!PRODUCT_STATUS_ORDER.includes(target)) {
    throw new BadRequestException(`Invalid status: ${newStatus}`);
  }

  validateProductTransition(current, target);
  await validateProductStageGateForTarget(deps.prisma, product, target);
  if (target === 'DEVELOPMENT') {
    await validateDevelopmentGate(
      deps.deliveryStageChecklistSync,
      deps.checklistTemplates,
      product,
    );
  }

  const updatedProduct = await writeProductLifecycle(
    deps.prisma,
    deps.notifications,
    id,
    target,
    product,
    actorId,
  );
  await deps.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(updatedProduct.id);
  await applyDeliveryOutcomeSideEffects(
    deps.prisma,
    deps.notifications,
    deps.partnerAccrualClassic,
    deps.partnerAccrualSubscription,
    id,
    target,
  );
  if (isLegacyPatchStatusTerminalOutcome(target)) {
    await deps.audit.log({
      entityType: 'PRODUCT',
      entityId: id,
      action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
      userId: actorId,
      projectId: product.projectId,
      changes: {
        deprecatedApiPath: 'PATCH /projects/products/:id/status',
        previousStatus: current,
        targetStatus: target,
        deliveryResolution: target === 'DONE' ? 'DONE' : 'CANCELLED',
      } as InputJsonValue,
    });
  }
  await maybeEnqueueTechnicalSpecialist(
    deps.productWhatsApp,
    deps.logger,
    updatedProduct,
    target,
    actorId,
  );
  return attachProductDeliveryLifecycle(updatedProduct);
}

export async function moveProductStage(
  deps: ProductDeliveryCommandDeps,
  id: string,
  data: MoveStageDto,
  actorId?: string,
) {
  const product = await findProductById(deps.prisma, id);
  ensureActiveForStageMove(product.deliveryLifecycle);
  const stage = parseDeliveryStage(data.stage);
  const target = productLegacyStatusForStage(stage) as ProductStatusEnum;

  validateProductTransition(product.status as ProductStatusEnum, target);
  await validateProductStageGateForTarget(deps.prisma, product, target);
  if (target === 'DEVELOPMENT') {
    await validateDevelopmentGate(
      deps.deliveryStageChecklistSync,
      deps.checklistTemplates,
      product,
    );
  }

  const updatedProduct = await writeProductLifecycle(
    deps.prisma,
    deps.notifications,
    id,
    target,
    product,
    actorId,
  );
  await deps.deliveryStageChecklistSync.syncProductAfterLifecycleWrite(updatedProduct.id);
  await applyDeliveryOutcomeSideEffects(
    deps.prisma,
    deps.notifications,
    deps.partnerAccrualClassic,
    deps.partnerAccrualSubscription,
    id,
    target,
  );
  await maybeEnqueueTechnicalSpecialist(
    deps.productWhatsApp,
    deps.logger,
    updatedProduct,
    target,
    undefined,
  );
  await publishProductChanged(deps.deliveryRealtime, updatedProduct.id);
  return attachProductDeliveryLifecycle(updatedProduct);
}
