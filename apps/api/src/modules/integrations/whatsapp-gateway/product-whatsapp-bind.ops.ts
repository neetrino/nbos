import type { PrismaClient, ProductCommunicationPurpose } from '@nbos/database';
import { upsertProductCommunicationBinding } from '../../messenger/core/product-communication-binding.ops';
import { dualWriteLegacyWorkBinding } from '../../messenger/core/product-communication-legacy-write.ops';
import { PRODUCT_COMMUNICATION_PURPOSE_WORK } from '../../messenger/core/product-communication.constants';
import { findMappedWhatsAppConversation } from '../../messenger/core/messenger-wa-ensure.ops';
import {
  resolveWhatsAppAccountantGroupChatId,
  resolveWhatsAppGatewayAccountId,
} from '../../messenger/core/product-communication-account';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type PersistBoundDestinationInput = {
  productId: string;
  purpose: ProductCommunicationPurpose;
  groupChatId: string;
  groupName: string | null;
  replace: boolean;
  createdFromDealId?: string | null;
};

export type PersistBoundDestinationResult = {
  conversationId: string;
  legacyBindingId: string | null;
  mappingAlreadyExisted: boolean;
};

export async function persistBoundDestination(
  prisma: PrismaLike,
  input: PersistBoundDestinationInput,
): Promise<PersistBoundDestinationResult> {
  const accountId = await resolveWhatsAppGatewayAccountId(prisma);
  const existingMapping = await findMappedWhatsAppConversation(
    prisma,
    accountId,
    input.groupChatId,
  );
  const bound = await upsertProductCommunicationBinding(prisma, {
    productId: input.productId,
    purpose: input.purpose,
    groupChatId: input.groupChatId,
    groupName: input.groupName,
    replace: input.replace,
    createdFromDealId: input.createdFromDealId,
  });
  // Dual-write returns null when unique groupChatId is taken (including P2002).
  const legacy =
    input.purpose === PRODUCT_COMMUNICATION_PURPOSE_WORK
      ? await dualWriteLegacyWorkBinding(prisma, {
          productId: input.productId,
          groupChatId: input.groupChatId,
          groupName: input.groupName,
          createdFromDealId: input.createdFromDealId,
        })
      : null;
  if (legacy) {
    await prisma.productCommunicationBinding.update({
      where: { id: bound.id },
      data: { legacyBindingId: legacy.id },
    });
  }
  return {
    conversationId: bound.conversationId,
    legacyBindingId: legacy?.id ?? null,
    mappingAlreadyExisted: Boolean(existingMapping),
  };
}

export type HealableLegacyBinding = {
  status: string;
  groupChatId: string | null;
  groupName: string | null;
};

/**
 * Unique-legacy ACTIVE + non-accountant JID with no resolver WORK → canonical WORK.
 * Same chat id; no Gateway create. Accountant JID is not treated as completed WORK.
 */
export async function maybeHealLegacyWorkDestination(
  prisma: PrismaLike,
  productId: string,
  binding: HealableLegacyBinding | null,
): Promise<boolean> {
  if (binding?.status !== 'ACTIVE' || !binding.groupChatId) return false;
  const accountant = await resolveWhatsAppAccountantGroupChatId(prisma);
  if (accountant && binding.groupChatId === accountant) return false;
  await persistBoundDestination(prisma, {
    productId,
    purpose: PRODUCT_COMMUNICATION_PURPOSE_WORK,
    groupChatId: binding.groupChatId,
    groupName: binding.groupName,
    replace: true,
  });
  return true;
}
