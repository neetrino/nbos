import type { PrismaClient } from '@nbos/database';
import { upsertProductCommunicationBinding } from './product-communication-binding.ops';
import { resolveWhatsAppAccountantGroupChatId } from './product-communication-account';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type ProductWorkBackfillCounts = {
  groupsMapped: number;
  workBindings: number;
  skippedAccountant: number;
};

/**
 * Idempotent WORK backfill from ProductWhatsAppGroupBinding.
 * Does not create FINANCE rows or INTERNAL chats. Accountant group is skipped.
 */
export async function backfillProductWorkBindings(
  prisma: PrismaLike,
): Promise<ProductWorkBackfillCounts> {
  const accountant = await resolveWhatsAppAccountantGroupChatId(prisma);
  const rows = await prisma.productWhatsAppGroupBinding.findMany({
    where: { groupChatId: { not: null } },
    select: {
      id: true,
      productId: true,
      groupChatId: true,
      groupName: true,
      createdFromDealId: true,
    },
  });
  const counts: ProductWorkBackfillCounts = {
    groupsMapped: 0,
    workBindings: 0,
    skippedAccountant: 0,
  };
  const seenChats = new Set<string>();
  for (const row of rows) {
    await backfillOneLegacyRow(prisma, row, accountant, seenChats, counts);
  }
  return counts;
}

async function backfillOneLegacyRow(
  prisma: PrismaLike,
  row: {
    id: string;
    productId: string;
    groupChatId: string | null;
    groupName: string | null;
    createdFromDealId: string | null;
  },
  accountant: string | null,
  seenChats: Set<string>,
  counts: ProductWorkBackfillCounts,
): Promise<void> {
  if (!row.groupChatId) return;
  if (accountant && row.groupChatId === accountant) {
    counts.skippedAccountant += 1;
    return;
  }
  await upsertProductCommunicationBinding(prisma, {
    productId: row.productId,
    purpose: 'WORK',
    groupChatId: row.groupChatId,
    groupName: row.groupName,
    legacyBindingId: row.id,
    createdFromDealId: row.createdFromDealId,
    replace: true,
  });
  counts.workBindings += 1;
  if (!seenChats.has(row.groupChatId)) {
    seenChats.add(row.groupChatId);
    counts.groupsMapped += 1;
  }
}
