import type { PrismaClient } from '@nbos/database';
import { buildProductWhatsAppParticipantDedupeKey } from '@nbos/shared';
import {
  WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
  WHATSAPP_AUDIT_GROUP_BOUND,
  WHATSAPP_AUDIT_GROUP_REPLACED,
} from './whatsapp-gateway.constants';
import type { AuditLogParams } from '../../audit/audit-log.params';
import type { EnqueueExistingWhatsAppOp } from './product-whatsapp-ensure-work.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function enqueueWhatsAppGroupOperation(
  prisma: PrismaLike,
  queue: { enqueueOperation: (operationId: string, dedupeKey: string) => Promise<boolean> },
  warn: (message: string) => void,
  operationId: string,
  dedupeKey: string,
  resetFailed: boolean,
): Promise<void> {
  if (resetFailed) {
    await prisma.whatsAppGroupOperation.update({
      where: { id: operationId },
      data: { status: 'PENDING', errorCode: null, errorMessage: null, failedAt: null },
    });
  }
  const queued = await queue.enqueueOperation(operationId, dedupeKey);
  await prisma.whatsAppGroupOperation.update({
    where: { id: operationId },
    data: {
      status: queued ? 'QUEUED' : 'PENDING',
      queuedAt: queued ? new Date() : undefined,
    },
  });
  if (!queued) {
    warn(
      `WhatsApp operation ${operationId} left PENDING (queue unavailable); scheduler can recover`,
    );
  }
}

export async function recordSucceededBindOperation(
  prisma: PrismaLike,
  auditLog: (entry: AuditLogParams) => Promise<unknown>,
  productId: string,
  bindingId: string | null,
  actorId: string,
  meta: {
    groupChatId: string;
    verified: boolean;
    purpose: 'WORK' | 'FINANCE';
    replaced: boolean;
    projectId: string;
  },
): Promise<void> {
  const operation = await prisma.whatsAppGroupOperation.create({
    data: {
      productId,
      bindingId,
      type: 'BIND_EXISTING_GROUP',
      status: 'SUCCEEDED',
      dedupeKey: `whatsapp-product-group:bind:${productId}:${meta.purpose}:${meta.groupChatId}:${Date.now()}`,
      source: 'MANUAL_BIND',
      requestedById: actorId,
      completedAt: new Date(),
      resultMetadata: {
        groupChatId: meta.groupChatId,
        verified: meta.verified,
        purpose: meta.purpose,
      },
    },
  });
  await auditLog({
    entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
    entityId: productId,
    action: meta.replaced ? WHATSAPP_AUDIT_GROUP_REPLACED : WHATSAPP_AUDIT_GROUP_BOUND,
    userId: actorId,
    projectId: meta.projectId,
    changes: {
      groupChatId: meta.groupChatId,
      operationId: operation.id,
      replaced: meta.replaced,
      purpose: meta.purpose,
    },
  });
}

export async function enqueueTechnicalSpecialistAdd(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  productId: string,
  bindingId: string,
  ts: { employeeId: string; roles: string[] },
  actorId?: string | null,
): Promise<boolean> {
  const dedupeKey = buildProductWhatsAppParticipantDedupeKey(productId, ts.employeeId);
  const existing = await prisma.whatsAppGroupOperation.findUnique({ where: { dedupeKey } });
  if (existing && ['SUCCEEDED', 'QUEUED', 'PROCESSING', 'PENDING'].includes(existing.status)) {
    return false;
  }
  const operation = await prisma.whatsAppGroupOperation.create({
    data: {
      productId,
      bindingId,
      type: 'ADD_PRODUCT_PARTICIPANT',
      status: 'PENDING',
      dedupeKey,
      source: 'DEVELOPMENT_TS',
      requestedById: actorId ?? null,
      safePayload: { employeeId: ts.employeeId, roles: ts.roles },
    },
  });
  await enqueueExisting(operation.id, dedupeKey, false);
  return true;
}

const OPERATION_LIST_TAKE = 50;

export async function listProductWhatsAppOperations(prisma: PrismaLike, productId: string) {
  const rows = await prisma.whatsAppGroupOperation.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: OPERATION_LIST_TAKE,
    select: {
      id: true,
      type: true,
      status: true,
      source: true,
      errorCode: true,
      errorMessage: true,
      attemptCount: true,
      createdAt: true,
      completedAt: true,
      failedAt: true,
    },
  });
  return {
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      failedAt: row.failedAt?.toISOString() ?? null,
    })),
  };
}
