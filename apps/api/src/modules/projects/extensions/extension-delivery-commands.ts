import { BadRequestException } from '@nestjs/common';
import { PrismaClient, type ExtensionStatusEnum, type InputJsonValue } from '@nbos/database';
import type { NotificationService } from '../../notifications/notification.service';
import type { PartnerAccrualClassicService } from '../../finance/partner-accrual/partner-accrual-classic.service';
import type { PartnerAccrualSubscriptionService } from '../../finance/partner-accrual/partner-accrual-subscription.service';
import type { SupportService } from '../../support/support.service';
import type { AuditService } from '../../audit/audit.service';
import type { DeliveryStageChecklistSyncService } from '../../checklist-templates/delivery-stage-checklist-sync.service';
import type { ChecklistTemplatesService } from '../../checklist-templates/checklist-templates.service';
import type { DeliveryRealtimePublisher } from '../../realtime/delivery-realtime.publisher';
import {
  DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
  isLegacyPatchStatusTerminalOutcome,
} from '../delivery-status-deprecation';
import {
  buildDeliveryPauseWrite,
  buildDeliveryResumeWrite,
  extensionLegacyStatusForStage,
} from '../delivery-lifecycle';
import {
  attachExtensionReadiness,
  validateExtensionStageGate,
  validateExtensionTransition,
} from './extension-stage-gates';
import { findExtensionById } from './extension-detail-read';
import {
  ensureActiveForStageMove,
  ensureNotTerminal,
  parseDeliveryStage,
  publishExtensionChanged,
} from './extension-delivery-guards';
import { parseDate, requireText } from './extension-input';
import {
  applyDeliveryOutcomeSideEffects,
  validateDevelopmentGate,
  writeExtensionLifecycle,
  writeTerminalExtensionCancel,
  writeTerminalExtensionComplete,
} from './extension-lifecycle-writes';

export interface PauseDeliveryDto {
  reason: string;
  onHoldUntil: string;
}

export interface CancelDeliveryDto {
  reason: string;
}

export interface MoveStageDto {
  stage: string;
}

export interface ExtensionDeliveryCommandDeps {
  prisma: InstanceType<typeof PrismaClient>;
  notifications: NotificationService;
  partnerAccrualClassic: PartnerAccrualClassicService;
  partnerAccrualSubscription: PartnerAccrualSubscriptionService;
  supportService: SupportService;
  audit: AuditService;
  deliveryStageChecklistSync: DeliveryStageChecklistSyncService;
  checklistTemplates: ChecklistTemplatesService;
  deliveryRealtime: DeliveryRealtimePublisher;
}

export async function updateExtensionStatus(
  deps: ExtensionDeliveryCommandDeps,
  id: string,
  newStatus: string,
  actorId: string,
) {
  const extension = await findExtensionById(deps.prisma, id);
  const current = extension.status as ExtensionStatusEnum;
  const target = newStatus as ExtensionStatusEnum;

  validateExtensionTransition(current, target);
  validateExtensionStageGate(extension, target);
  if (target === 'DEVELOPMENT') {
    await validateDevelopmentGate(
      deps.deliveryStageChecklistSync,
      deps.checklistTemplates,
      extension.id,
    );
  }

  const updated = await writeExtensionLifecycle(
    deps.prisma,
    deps.notifications,
    id,
    target,
    extension,
    actorId,
  );
  await deps.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(updated.id);
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
      entityType: 'EXTENSION',
      entityId: id,
      action: DEPRECATED_PATCH_STATUS_TERMINAL_AUDIT_ACTION,
      userId: actorId,
      projectId: extension.projectId,
      changes: {
        deprecatedApiPath: 'PATCH /projects/extensions/:id/status',
        previousStatus: current,
        targetStatus: target,
        deliveryResolution: target === 'DONE' ? 'DONE' : 'CANCELLED',
      } as InputJsonValue,
    });
  }
  return attachExtensionReadiness(updated);
}

export async function moveExtensionStage(
  deps: ExtensionDeliveryCommandDeps,
  id: string,
  data: MoveStageDto,
  actorId?: string,
) {
  const extension = await findExtensionById(deps.prisma, id);
  ensureActiveForStageMove(extension.deliveryLifecycle);
  const stage = parseDeliveryStage(data.stage);
  const target = extensionLegacyStatusForStage(stage) as ExtensionStatusEnum;

  validateExtensionTransition(extension.status as ExtensionStatusEnum, target);
  validateExtensionStageGate(extension, target);
  if (target === 'DEVELOPMENT') {
    await validateDevelopmentGate(
      deps.deliveryStageChecklistSync,
      deps.checklistTemplates,
      extension.id,
    );
  }

  const updated = await writeExtensionLifecycle(
    deps.prisma,
    deps.notifications,
    id,
    target,
    extension,
    actorId,
  );
  await deps.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(updated.id);
  await applyDeliveryOutcomeSideEffects(
    deps.prisma,
    deps.notifications,
    deps.partnerAccrualClassic,
    deps.partnerAccrualSubscription,
    id,
    target,
  );
  await publishExtensionChanged(deps.deliveryRealtime, updated.id);
  return attachExtensionReadiness(updated);
}

export async function pauseExtension(
  deps: ExtensionDeliveryCommandDeps,
  id: string,
  data: PauseDeliveryDto,
) {
  const extension = await findExtensionById(deps.prisma, id);
  ensureNotTerminal(extension.deliveryLifecycle.resolution);
  const reason = requireText(data.reason, 'reason');
  const onHoldUntil = parseDate(data.onHoldUntil, 'onHoldUntil');
  const updated = await deps.prisma.extension.update({
    where: { id },
    data: buildDeliveryPauseWrite(extension, reason, onHoldUntil),
    include: {
      project: { select: { id: true, code: true, name: true } },
      product: { select: { id: true, name: true } },
      order: { select: { id: true, code: true, status: true } },
    },
  });
  await publishExtensionChanged(deps.deliveryRealtime, updated.id);
  return attachExtensionReadiness(updated);
}

export async function resumeExtension(deps: ExtensionDeliveryCommandDeps, id: string) {
  const extension = await findExtensionById(deps.prisma, id);
  ensureNotTerminal(extension.deliveryLifecycle.resolution);
  if (extension.deliveryLifecycle.workStatus !== 'ON_HOLD') {
    throw new BadRequestException('Extension is not on hold');
  }
  const nextStatus = extensionLegacyStatusForStage(extension.deliveryLifecycle.stage);
  const updated = await deps.prisma.extension.update({
    where: { id },
    data: { status: nextStatus as ExtensionStatusEnum, ...buildDeliveryResumeWrite(extension) },
    include: {
      project: { select: { id: true, code: true, name: true } },
      product: { select: { id: true, name: true } },
      order: { select: { id: true, code: true, status: true } },
    },
  });
  await deps.deliveryStageChecklistSync.syncExtensionAfterLifecycleWrite(updated.id);
  await publishExtensionChanged(deps.deliveryRealtime, updated.id);
  return attachExtensionReadiness(updated);
}

export async function cancelExtension(
  deps: ExtensionDeliveryCommandDeps,
  id: string,
  data: CancelDeliveryDto,
  actorId: string,
) {
  const extension = await findExtensionById(deps.prisma, id);
  ensureNotTerminal(extension.deliveryLifecycle.resolution);
  const reason = requireText(data.reason, 'reason');
  const closedAt = new Date();
  const updated = await writeTerminalExtensionCancel(
    deps.prisma,
    id,
    extension,
    reason,
    closedAt,
    actorId,
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
    entityType: 'EXTENSION',
    entityId: id,
    action: 'delivery.cancelled',
    userId: actorId,
    projectId: extension.projectId,
    changes: { reason } as InputJsonValue,
  });
  await publishExtensionChanged(deps.deliveryRealtime, updated.id);
  return attachExtensionReadiness(updated);
}

export async function completeExtension(
  deps: ExtensionDeliveryCommandDeps,
  id: string,
  actorId: string,
) {
  const extension = await findExtensionById(deps.prisma, id);
  ensureActiveForStageMove(extension.deliveryLifecycle);
  const target = 'DONE' as ExtensionStatusEnum;

  validateExtensionTransition(extension.status as ExtensionStatusEnum, target);
  validateExtensionStageGate(extension, target);
  if (target === 'DEVELOPMENT') {
    await validateDevelopmentGate(
      deps.deliveryStageChecklistSync,
      deps.checklistTemplates,
      extension.id,
    );
  }

  const closedAt = new Date();
  const updated = await writeTerminalExtensionComplete(
    deps.prisma,
    id,
    target,
    extension,
    closedAt,
    actorId,
  );
  await applyDeliveryOutcomeSideEffects(
    deps.prisma,
    deps.notifications,
    deps.partnerAccrualClassic,
    deps.partnerAccrualSubscription,
    id,
    target,
  );
  await deps.supportService.closeLinkedTicketsAfterExtensionDelivered(id, actorId);
  await deps.audit.log({
    entityType: 'EXTENSION',
    entityId: id,
    action: 'delivery.completed',
    userId: actorId,
    projectId: extension.projectId,
    changes: { deliveryResolution: 'DONE' } as InputJsonValue,
  });
  await publishExtensionChanged(deps.deliveryRealtime, updated.id);
  return attachExtensionReadiness(updated);
}
