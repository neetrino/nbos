import { ConflictException } from '@nestjs/common';
import {
  classifyDatabaseError,
  PrismaClient,
  type ProductCommunicationPurpose,
} from '@nbos/database';
import { ensureWhatsAppClientConversation } from './messenger-wa-ensure.ops';
import {
  PRODUCT_COMMUNICATION_ACCOUNTANT_FORBIDDEN,
  PRODUCT_COMMUNICATION_BINDING_ACTIVE,
  PRODUCT_COMMUNICATION_PURPOSE_ALREADY_ACTIVE,
} from './product-communication.constants';
import {
  resolveWhatsAppAccountantGroupChatId,
  resolveWhatsAppGatewayAccountId,
} from './product-communication-account';
import { bumpGlobalConversationRevision } from './messenger-core-revision-write.ops';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type UpsertProductCommunicationBindingInput = {
  productId: string;
  purpose: ProductCommunicationPurpose;
  groupChatId: string;
  groupName?: string | null;
  legacyBindingId?: string | null;
  createdFromDealId?: string | null;
  replace?: boolean;
};

export type UpsertProductCommunicationBindingResult = {
  id: string;
  conversationId: string;
  created: boolean;
};

export async function upsertProductCommunicationBinding(
  prisma: PrismaLike,
  input: UpsertProductCommunicationBindingInput,
): Promise<UpsertProductCommunicationBindingResult> {
  await assertNotAccountantGroup(prisma, input.groupChatId);
  const accountId = await resolveWhatsAppGatewayAccountId(prisma);
  const ensured = await ensureWhatsAppClientConversation(prisma, {
    accountId,
    chatId: input.groupChatId,
    title: input.groupName ?? null,
  });
  const existing = await prisma.productCommunicationBinding.findUnique({
    where: { productId_purpose: { productId: input.productId, purpose: input.purpose } },
    select: { id: true, conversationId: true },
  });
  if (existing && existing.conversationId !== ensured.id && !input.replace) {
    throw new ConflictException(PRODUCT_COMMUNICATION_PURPOSE_ALREADY_ACTIVE);
  }
  return persistBindingRow(prisma, input, ensured.id, existing);
}

async function persistBindingRow(
  prisma: PrismaLike,
  input: UpsertProductCommunicationBindingInput,
  conversationId: string,
  existing: { id: string; conversationId: string } | null,
): Promise<UpsertProductCommunicationBindingResult> {
  if (existing) {
    return runMessengerWriteTx(prisma, async (tx) => {
      const updated = await tx.productCommunicationBinding.update({
        where: { id: existing.id },
        data: {
          conversationId,
          status: PRODUCT_COMMUNICATION_BINDING_ACTIVE,
          legacyBindingId: input.legacyBindingId ?? undefined,
          createdFromDealId: input.createdFromDealId ?? undefined,
        },
        select: { id: true, conversationId: true },
      });
      await bumpGlobalConversationRevision(tx, 'CLIENT', conversationId);
      return { ...updated, created: false };
    });
  }
  return createBindingRow(prisma, input, conversationId);
}

async function createBindingRow(
  prisma: PrismaLike,
  input: UpsertProductCommunicationBindingInput,
  conversationId: string,
): Promise<UpsertProductCommunicationBindingResult> {
  try {
    const created = await runMessengerWriteTx(prisma, async (tx) => {
      const row = await tx.productCommunicationBinding.create({
        data: {
          productId: input.productId,
          purpose: input.purpose,
          conversationId,
          status: PRODUCT_COMMUNICATION_BINDING_ACTIVE,
          legacyBindingId: input.legacyBindingId ?? null,
          createdFromDealId: input.createdFromDealId ?? null,
        },
        select: { id: true, conversationId: true },
      });
      await bumpGlobalConversationRevision(tx, 'CLIENT', conversationId);
      return row;
    });
    return { ...created, created: true };
  } catch (error) {
    if (classifyDatabaseError(error)?.code !== 'DB_UNIQUE_CONSTRAINT') throw error;
    throw new ConflictException(PRODUCT_COMMUNICATION_PURPOSE_ALREADY_ACTIVE);
  }
}

export async function clearProductFinanceBinding(
  prisma: PrismaLike,
  productId: string,
): Promise<void> {
  await prisma.productCommunicationBinding.deleteMany({
    where: { productId, purpose: 'FINANCE' },
  });
}

async function assertNotAccountantGroup(prisma: PrismaLike, groupChatId: string): Promise<void> {
  const accountant = await resolveWhatsAppAccountantGroupChatId(prisma);
  if (accountant && accountant === groupChatId) {
    throw new ConflictException(PRODUCT_COMMUNICATION_ACCOUNTANT_FORBIDDEN);
  }
}
