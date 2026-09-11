import {
  classifyDatabaseError,
  type PrismaClient,
  type ProductWhatsAppGroupBindingStatusEnum,
} from '@nbos/database';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type DualWriteLegacyWorkInput = {
  productId: string;
  groupChatId: string;
  groupName: string | null;
  createdFromDealId?: string | null;
};

const LEGACY_DETACHED_STATUS = 'FAILED' satisfies ProductWhatsAppGroupBindingStatusEnum;

/**
 * Writes ProductWhatsAppGroupBinding when unique groupChatId allows.
 * Shared conversations skip a second legacy row (DELETE-LATER uniqueness)
 * and detach this Product's stale unique-legacy so invite/sync/TS no-op.
 */
export async function dualWriteLegacyWorkBinding(
  prisma: PrismaLike,
  input: DualWriteLegacyWorkInput,
): Promise<{ id: string } | null> {
  if (await isLegacyGroupChatTaken(prisma, input)) {
    await detachProductUniqueLegacyWorkBinding(prisma, input.productId);
    return null;
  }
  try {
    return await writeUniqueLegacyWorkRow(prisma, input);
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    await detachProductUniqueLegacyWorkBinding(prisma, input.productId);
    return null;
  }
}

async function isLegacyGroupChatTaken(
  prisma: PrismaLike,
  input: DualWriteLegacyWorkInput,
): Promise<boolean> {
  const taken = await prisma.productWhatsAppGroupBinding.findFirst({
    where: { groupChatId: input.groupChatId, productId: { not: input.productId } },
    select: { id: true },
  });
  return Boolean(taken);
}

async function writeUniqueLegacyWorkRow(
  prisma: PrismaLike,
  input: DualWriteLegacyWorkInput,
): Promise<{ id: string }> {
  const existing = await prisma.productWhatsAppGroupBinding.findUnique({
    where: { productId: input.productId },
    select: { id: true },
  });
  if (existing) {
    return prisma.productWhatsAppGroupBinding.update({
      where: { id: existing.id },
      data: {
        groupChatId: input.groupChatId,
        groupName: input.groupName,
        status: 'ACTIVE',
        lastErrorCode: null,
        lastErrorMessage: null,
        lastSuccessfulSyncAt: new Date(),
        createdFromDeal: input.createdFromDealId
          ? { connect: { id: input.createdFromDealId } }
          : undefined,
      },
      select: { id: true },
    });
  }
  return prisma.productWhatsAppGroupBinding.create({
    data: {
      product: { connect: { id: input.productId } },
      groupChatId: input.groupChatId,
      groupName: input.groupName,
      status: 'ACTIVE',
      lastErrorCode: null,
      lastErrorMessage: null,
      lastSuccessfulSyncAt: new Date(),
      createdFromDeal: input.createdFromDealId
        ? { connect: { id: input.createdFromDealId } }
        : undefined,
    },
    select: { id: true },
  });
}

async function detachProductUniqueLegacyWorkBinding(
  prisma: PrismaLike,
  productId: string,
): Promise<void> {
  const existing = await prisma.productWhatsAppGroupBinding.findUnique({
    where: { productId },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.productWhatsAppGroupBinding.update({
    where: { id: existing.id },
    data: {
      groupChatId: null,
      status: LEGACY_DETACHED_STATUS,
    },
  });
}
