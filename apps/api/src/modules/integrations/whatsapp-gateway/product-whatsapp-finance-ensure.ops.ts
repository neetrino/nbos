import type { PrismaClient, WhatsAppGroupOperationSourceEnum } from '@nbos/database';
import { buildProductWhatsAppFinanceCreateDedupeKey } from '@nbos/shared';
import { resolveClientDestination } from '../../messenger/core/product-communication-resolver';
import type { WhatsAppProductGroupsQueueService } from './whatsapp-product-groups-queue.service';

type PrismaLike = InstanceType<typeof PrismaClient>;

const ACTIVE_CREATE_STATUSES = [
  'PENDING',
  'QUEUED',
  'PROCESSING',
  'SUCCEEDED',
  'OUTCOME_UNKNOWN',
] as const;

export async function enqueueFinanceGroupCreate(
  prisma: PrismaLike,
  queue: WhatsAppProductGroupsQueueService,
  input: {
    productId: string;
    source: WhatsAppGroupOperationSourceEnum;
    contextDealId?: string | null;
    actorId?: string | null;
  },
): Promise<'exists' | 'enqueued'> {
  const existing = await resolveClientDestination(prisma, input.productId, 'FINANCE');
  if (existing && !existing.fallbackFromWork) return 'exists';
  const dedupeKey = buildProductWhatsAppFinanceCreateDedupeKey(input.productId);
  const existingOp = await prisma.whatsAppGroupOperation.findUnique({ where: { dedupeKey } });
  if (existingOp && (ACTIVE_CREATE_STATUSES as readonly string[]).includes(existingOp.status)) {
    if (existingOp.status === 'PENDING' || existingOp.status === 'QUEUED') {
      await queue.enqueueOperation(existingOp.id, dedupeKey);
    }
    return 'enqueued';
  }
  return upsertFinanceCreateOperation(prisma, queue, dedupeKey, input);
}

async function upsertFinanceCreateOperation(
  prisma: PrismaLike,
  queue: WhatsAppProductGroupsQueueService,
  dedupeKey: string,
  input: {
    productId: string;
    source: WhatsAppGroupOperationSourceEnum;
    contextDealId?: string | null;
    actorId?: string | null;
  },
): Promise<'enqueued'> {
  const operation = await prisma.whatsAppGroupOperation.upsert({
    where: { dedupeKey },
    create: {
      productId: input.productId,
      type: 'CREATE_FINANCE_GROUP',
      status: 'PENDING',
      dedupeKey,
      source: input.source,
      contextDealId: input.contextDealId ?? null,
      requestedById: input.actorId ?? null,
      safePayload: { productId: input.productId, purpose: 'FINANCE' },
    },
    update: {
      status: 'PENDING',
      type: 'CREATE_FINANCE_GROUP',
      source: input.source,
      contextDealId: input.contextDealId ?? null,
      requestedById: input.actorId ?? null,
      errorCode: null,
      errorMessage: null,
      failedAt: null,
      completedAt: null,
      safePayload: { productId: input.productId, purpose: 'FINANCE' },
    },
  });
  const queued = await queue.enqueueOperation(operation.id, dedupeKey);
  await prisma.whatsAppGroupOperation.update({
    where: { id: operation.id },
    data: { status: queued ? 'QUEUED' : 'PENDING', queuedAt: queued ? new Date() : undefined },
  });
  return 'enqueued';
}
