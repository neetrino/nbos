import type { PrismaClient } from '@nbos/database';
import { resolveWhatsAppAccountantGroupChatId } from './product-communication-account';
import { resolveClientDestination } from './product-communication-resolver';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type UniqueLegacyWorkFields = {
  id: string;
  status: string;
  groupChatId: string | null;
};

export type ProductWorkLegacyPlan = {
  workGroupChatId: string | null;
  usableLegacy: { id: string; groupChatId: string } | null;
};

/**
 * Unique-legacy is a Product destination only when it matches resolver WORK
 * and is not the official accountant group.
 */
export function isUsableUniqueLegacyWorkDestination(input: {
  status: string;
  groupChatId: string | null;
  workGroupChatId: string | null;
  accountantGroupChatId: string | null;
}): boolean {
  if (input.status !== 'ACTIVE' || !input.groupChatId) return false;
  if (!input.workGroupChatId || input.groupChatId !== input.workGroupChatId) return false;
  if (input.accountantGroupChatId && input.groupChatId === input.accountantGroupChatId) {
    return false;
  }
  return true;
}

/** Transport / gate / overlay JID is resolver WORK only — never unique-legacy fallback. */
export function resolveWorkTransportChatId(
  workGroupChatId: string | null,
  accountantGroupChatId: string | null,
): string | null {
  if (!workGroupChatId) return null;
  if (accountantGroupChatId && workGroupChatId === accountantGroupChatId) return null;
  return workGroupChatId;
}

export async function loadProductWorkLegacyPlan(
  prisma: PrismaLike,
  productId: string,
): Promise<ProductWorkLegacyPlan> {
  const [work, binding, accountant] = await Promise.all([
    resolveClientDestination(prisma, productId, 'WORK'),
    prisma.productWhatsAppGroupBinding.findUnique({
      where: { productId },
      select: { id: true, status: true, groupChatId: true },
    }),
    resolveWhatsAppAccountantGroupChatId(prisma),
  ]);
  const workGroupChatId = resolveWorkTransportChatId(work?.groupChatId ?? null, accountant);
  return {
    workGroupChatId,
    usableLegacy: toUsableLegacy(binding, workGroupChatId, accountant),
  };
}

export async function loadWorkTransportChatId(
  prisma: PrismaLike,
  productId: string,
): Promise<string | null> {
  const plan = await loadProductWorkLegacyPlan(prisma, productId);
  return plan.workGroupChatId;
}

function toUsableLegacy(
  binding: UniqueLegacyWorkFields | null,
  workGroupChatId: string | null,
  accountantGroupChatId: string | null,
): { id: string; groupChatId: string } | null {
  if (!binding?.groupChatId) return null;
  if (
    !isUsableUniqueLegacyWorkDestination({
      status: binding.status,
      groupChatId: binding.groupChatId,
      workGroupChatId,
      accountantGroupChatId,
    })
  ) {
    return null;
  }
  return { id: binding.id, groupChatId: binding.groupChatId };
}
