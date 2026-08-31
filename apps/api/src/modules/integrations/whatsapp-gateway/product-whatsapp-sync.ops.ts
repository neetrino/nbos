import type { PrismaClient } from '@nbos/database';
import { loadProductWorkLegacyPlan } from '../../messenger/core/product-communication-legacy-destination';
import type { EnqueueExistingWhatsAppOp } from './product-whatsapp-ensure-work.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type SyncParticipantsResult = 'noop_shared' | 'needs_ensure' | 'queued';

/**
 * Shared / stale / accountant unique-legacy: 200 no-op when WORK exists
 * (no forged bindingId FK, no second sync). Unique-legacy matching WORK: enqueue.
 * Missing WORK: caller should ensure.
 */
export async function planProductParticipantSync(
  prisma: PrismaLike,
  productId: string,
): Promise<{ result: SyncParticipantsResult; bindingId: string | null }> {
  const plan = await loadProductWorkLegacyPlan(prisma, productId);
  if (plan.workGroupChatId && !plan.usableLegacy) {
    return { result: 'noop_shared', bindingId: null };
  }
  if (!plan.usableLegacy) return { result: 'needs_ensure', bindingId: null };
  return { result: 'queued', bindingId: plan.usableLegacy.id };
}

export async function createParticipantSyncOperation(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  productId: string,
  bindingId: string,
  actorId?: string | null,
): Promise<void> {
  const dedupeKey = `whatsapp-product-group:sync:${productId}:${Date.now()}`;
  const operation = await prisma.whatsAppGroupOperation.create({
    data: {
      productId,
      bindingId,
      type: 'SYNC_PRODUCT_PARTICIPANTS',
      status: 'PENDING',
      dedupeKey,
      source: 'MANUAL_SYNC',
      requestedById: actorId ?? null,
    },
  });
  await enqueueExisting(operation.id, dedupeKey, false);
}
