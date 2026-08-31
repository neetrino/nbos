import type { PrismaClient, WhatsAppGroupOperationSourceEnum } from '@nbos/database';
import { buildProductWhatsAppCreateDedupeKey } from '@nbos/shared';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';
import {
  WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
  WHATSAPP_AUDIT_GROUP_REQUESTED,
  WHATSAPP_AUDIT_MANUAL_RETRY,
  WHATSAPP_ERROR,
} from './whatsapp-gateway.constants';
import { throwWhatsAppDomainError } from './whatsapp-gateway.errors';
import { maybeHealLegacyWorkDestination } from './product-whatsapp-bind.ops';
import type { EnsureProductWhatsAppGroupInput } from './whatsapp-gateway.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type EnqueueExistingWhatsAppOp = (
  operationId: string,
  dedupeKey: string,
  resetFailed: boolean,
) => Promise<void>;

export type EnsureWorkAuditLog = (entry: {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  projectId: string;
  changes: Record<string, unknown>;
}) => Promise<unknown>;

const STALE_PROCESSING_MS = 5 * 60 * 1000;

type LegacyBindingRow = {
  id: string;
  status: string;
  groupChatId: string | null;
  groupName: string | null;
  createdFromDealId: string | null;
};

/**
 * Ensures canonical WORK without creating a second Gateway group when unique-legacy
 * already holds a non-accountant JID. Accountant unique-legacy is not a completed WORK.
 */
export async function ensureWorkGroupForProduct(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  auditLog: EnsureWorkAuditLog | null,
  productId: string,
  input: EnsureProductWhatsAppGroupInput,
): Promise<void> {
  const work = await resolveClientDestination(prisma, productId, 'WORK');
  if (work) return;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, projectId: true },
  });
  if (!product) {
    throwWhatsAppDomainError(400, WHATSAPP_ERROR.PRODUCT_GROUP_NOT_FOUND, 'Product not found');
  }
  const binding = await prisma.productWhatsAppGroupBinding.findUnique({
    where: { productId },
  });
  if (await maybeHealLegacyWorkDestination(prisma, productId, binding)) return;
  await recoverOrEnqueueWorkCreate(prisma, enqueueExisting, auditLog, product, binding, input);
}

async function recoverOrEnqueueWorkCreate(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  auditLog: EnsureWorkAuditLog | null,
  product: { id: string; projectId: string },
  binding: LegacyBindingRow | null,
  input: EnsureProductWhatsAppGroupInput,
): Promise<void> {
  if (binding?.status === 'OUTCOME_UNKNOWN' || binding?.status === 'NEEDS_RECONCILIATION') {
    return;
  }
  if (await recoverInFlightCreate(prisma, enqueueExisting, product.id, binding)) return;
  if (await recoverExistingCreateOp(prisma, enqueueExisting, product.id, input)) return;
  await startNewWorkCreate(prisma, enqueueExisting, auditLog, product, binding, input);
}

async function recoverInFlightCreate(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  productId: string,
  binding: LegacyBindingRow | null,
): Promise<boolean> {
  if (binding?.status !== 'CREATING' && binding?.status !== 'PENDING') return false;
  const activeOp = await prisma.whatsAppGroupOperation.findFirst({
    where: {
      productId,
      type: 'CREATE_PRODUCT_GROUP',
      status: { in: ['PENDING', 'QUEUED', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!activeOp) return false;
  if (activeOp.status === 'PENDING' || activeOp.status === 'QUEUED') {
    await enqueueExisting(activeOp.id, activeOp.dedupeKey, false);
    return true;
  }
  if (isStaleProcessing(activeOp.startedAt)) {
    await markStaleCreateFailed(prisma, productId, activeOp.id);
  }
  return true;
}

async function recoverExistingCreateOp(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  productId: string,
  input: EnsureProductWhatsAppGroupInput,
): Promise<boolean> {
  const dedupeKey = buildProductWhatsAppCreateDedupeKey(productId);
  const existingOp = await prisma.whatsAppGroupOperation.findUnique({ where: { dedupeKey } });
  if (!existingOp) return false;
  if (
    existingOp.status === 'SUCCEEDED' ||
    existingOp.status === 'QUEUED' ||
    existingOp.status === 'PROCESSING' ||
    existingOp.status === 'PENDING' ||
    existingOp.status === 'OUTCOME_UNKNOWN'
  ) {
    if (existingOp.status === 'PENDING' || existingOp.status === 'QUEUED') {
      await enqueueExisting(existingOp.id, dedupeKey, false);
    }
    return true;
  }
  if (existingOp.status !== 'FAILED') return false;
  await prisma.whatsAppGroupOperation.update({
    where: { id: existingOp.id },
    data: {
      status: 'PENDING',
      source: input.source as WhatsAppGroupOperationSourceEnum,
      contextDealId: input.contextDealId ?? null,
      requestedById: input.actorId ?? null,
      errorCode: null,
      errorMessage: null,
      failedAt: null,
      completedAt: null,
    },
  });
  await enqueueExisting(existingOp.id, dedupeKey, false);
  return true;
}

async function startNewWorkCreate(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  auditLog: EnsureWorkAuditLog | null,
  product: { id: string; projectId: string },
  binding: LegacyBindingRow | null,
  input: EnsureProductWhatsAppGroupInput,
): Promise<void> {
  const nextBinding = await ensurePendingLegacyRow(prisma, product.id, binding, input);
  const dedupeKey = buildProductWhatsAppCreateDedupeKey(product.id);
  const operation = await prisma.whatsAppGroupOperation.upsert({
    where: { dedupeKey },
    create: {
      productId: product.id,
      bindingId: nextBinding.id,
      type: 'CREATE_PRODUCT_GROUP',
      status: 'PENDING',
      dedupeKey,
      source: input.source as WhatsAppGroupOperationSourceEnum,
      contextDealId: input.contextDealId ?? null,
      requestedById: input.actorId ?? null,
      safePayload: { productId: product.id },
    },
    update: {
      status: 'PENDING',
      source: input.source as WhatsAppGroupOperationSourceEnum,
      contextDealId: input.contextDealId ?? null,
      requestedById: input.actorId ?? null,
      bindingId: nextBinding.id,
      errorCode: null,
      errorMessage: null,
      failedAt: null,
      completedAt: null,
      safePayload: { productId: product.id },
    },
  });
  await enqueueExisting(operation.id, dedupeKey, false);
  await writeEnsureRequestedAudit(auditLog, product, input, operation.id);
}

async function ensurePendingLegacyRow(
  prisma: PrismaLike,
  productId: string,
  binding: LegacyBindingRow | null,
  input: EnsureProductWhatsAppGroupInput,
): Promise<{ id: string }> {
  const nextBinding =
    binding ??
    (await prisma.productWhatsAppGroupBinding.create({
      data: {
        productId,
        status: 'PENDING',
        createdFromDealId: input.contextDealId ?? null,
      },
    }));
  if (nextBinding.status === 'FAILED' || nextBinding.status === 'PENDING') {
    await prisma.productWhatsAppGroupBinding.update({
      where: { id: nextBinding.id },
      data: {
        status: 'PENDING',
        lastErrorCode: null,
        lastErrorMessage: null,
        createdFromDealId: input.contextDealId ?? nextBinding.createdFromDealId,
      },
    });
  }
  return nextBinding;
}

async function markStaleCreateFailed(
  prisma: PrismaLike,
  productId: string,
  operationId: string,
): Promise<void> {
  await prisma.whatsAppGroupOperation.update({
    where: { id: operationId },
    data: {
      status: 'FAILED',
      failedAt: new Date(),
      errorCode: WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED,
      errorMessage: 'Create stuck in PROCESSING after Gateway failure; reset for manual retry',
    },
  });
  await prisma.productWhatsAppGroupBinding.updateMany({
    where: { productId, status: { in: ['PENDING', 'CREATING'] } },
    data: {
      status: 'FAILED',
      lastErrorCode: WHATSAPP_ERROR.PRODUCT_GROUP_CREATE_FAILED,
      lastErrorMessage: 'Create stuck in PROCESSING after Gateway failure; reset for manual retry',
    },
  });
}

async function writeEnsureRequestedAudit(
  auditLog: EnsureWorkAuditLog | null,
  product: { id: string; projectId: string },
  input: EnsureProductWhatsAppGroupInput,
  operationId: string,
): Promise<void> {
  if (!input.actorId || !auditLog) return;
  await auditLog({
    entityType: WHATSAPP_AUDIT_ENTITY_PRODUCT_GROUP,
    entityId: product.id,
    action:
      input.source === 'MANUAL_RETRY'
        ? WHATSAPP_AUDIT_MANUAL_RETRY
        : WHATSAPP_AUDIT_GROUP_REQUESTED,
    userId: input.actorId,
    projectId: product.projectId,
    changes: { source: input.source, operationId },
  });
}

function isStaleProcessing(startedAt: Date | null | undefined): boolean {
  if (!startedAt) return true;
  return Date.now() - startedAt.getTime() > STALE_PROCESSING_MS;
}
