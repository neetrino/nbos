import type { PrismaClient, ProductCommunicationPurpose } from '@nbos/database';
import { resolveWhatsAppAccountantGroupChatId } from './product-communication-account';
import {
  PRODUCT_COMMUNICATION_PURPOSE_FINANCE,
  PRODUCT_COMMUNICATION_PURPOSE_WORK,
} from './product-communication.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;
type MappedDestination = {
  conversationId: string;
  groupChatId: string;
  accountId: string;
};

export type ClientDestination = {
  productId: string;
  requestedPurpose: ProductCommunicationPurpose;
  resolvedPurpose: ProductCommunicationPurpose;
  conversationId: string;
  groupChatId: string;
  accountId: string;
  fallbackFromWork: boolean;
};

/**
 * Deterministic Product destination lookup (M-WA-03, M-WA-05).
 * WORK → active WORK mapping. FINANCE → explicit FINANCE else WORK.
 */
export async function resolveClientDestination(
  prisma: PrismaLike,
  productId: string,
  purpose: ProductCommunicationPurpose,
): Promise<ClientDestination | null> {
  const accountant = await resolveWhatsAppAccountantGroupChatId(prisma);
  if (purpose === PRODUCT_COMMUNICATION_PURPOSE_FINANCE) {
    const explicit = await loadMappedDestination(prisma, productId, 'FINANCE', accountant);
    if (explicit) return toDestination(productId, 'FINANCE', 'FINANCE', explicit, false);
  }
  const work = await loadMappedDestination(prisma, productId, 'WORK', accountant);
  if (!work) return null;
  const fallback = purpose === PRODUCT_COMMUNICATION_PURPOSE_FINANCE;
  return toDestination(productId, purpose, PRODUCT_COMMUNICATION_PURPOSE_WORK, work, fallback);
}

async function loadMappedDestination(
  prisma: PrismaLike,
  productId: string,
  purpose: ProductCommunicationPurpose,
  accountantGroupChatId: string | null,
): Promise<MappedDestination | null> {
  const row = await loadActiveDestination(prisma, productId, purpose);
  if (!row) return null;
  if (accountantGroupChatId && row.groupChatId === accountantGroupChatId) return null;
  return row;
}

async function loadActiveDestination(
  prisma: PrismaLike,
  productId: string,
  purpose: ProductCommunicationPurpose,
): Promise<MappedDestination | null> {
  const binding = await prisma.productCommunicationBinding.findUnique({
    where: { productId_purpose: { productId, purpose } },
    select: {
      conversationId: true,
      conversation: {
        select: {
          externalMappings: {
            where: { provider: 'WHATSAPP' },
            take: 1,
            select: { externalAccountId: true, externalConversationId: true },
          },
        },
      },
    },
  });
  const mapping = binding?.conversation.externalMappings[0];
  if (!binding || !mapping) return null;
  return {
    conversationId: binding.conversationId,
    groupChatId: mapping.externalConversationId,
    accountId: mapping.externalAccountId,
  };
}

function toDestination(
  productId: string,
  requestedPurpose: ProductCommunicationPurpose,
  resolvedPurpose: ProductCommunicationPurpose,
  row: MappedDestination,
  fallbackFromWork: boolean,
): ClientDestination {
  return {
    productId,
    requestedPurpose,
    resolvedPurpose,
    conversationId: row.conversationId,
    groupChatId: row.groupChatId,
    accountId: row.accountId,
    fallbackFromWork,
  };
}
