import type { PrismaClient } from '@nbos/database';
import { loadProductWorkLegacyPlan } from '../../messenger/core/product-communication-legacy-destination';
import { enqueueTechnicalSpecialistAdd } from './product-whatsapp-operation.ops';
import type { EnqueueExistingWhatsAppOp } from './product-whatsapp-ensure-work.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type TechnicalSpecialistCandidate = {
  employeeId: string;
  roles: string[];
};

/**
 * ADD only when unique-legacy matches resolver WORK and is not the accountant JID.
 * Otherwise heal/create WORK (same as ensureWorkGroupForProduct) and do not ADD.
 */
export async function runEnsureTechnicalSpecialist(
  prisma: PrismaLike,
  enqueueExisting: EnqueueExistingWhatsAppOp,
  ensureWork: () => Promise<void>,
  resolveTs: () => Promise<TechnicalSpecialistCandidate | null>,
  productId: string,
  actorId?: string | null,
): Promise<void> {
  const ts = await resolveTs();
  if (!ts) return;
  const bindingId = await resolveUsableLegacyBindingId(prisma, productId, ensureWork);
  if (!bindingId) return;
  await enqueueTechnicalSpecialistAdd(prisma, enqueueExisting, productId, bindingId, ts, actorId);
}

async function resolveUsableLegacyBindingId(
  prisma: PrismaLike,
  productId: string,
  ensureWork: () => Promise<void>,
): Promise<string | null> {
  const first = await loadProductWorkLegacyPlan(prisma, productId);
  if (first.usableLegacy) return first.usableLegacy.id;
  await ensureWork();
  const healed = await loadProductWorkLegacyPlan(prisma, productId);
  return healed.usableLegacy?.id ?? null;
}
