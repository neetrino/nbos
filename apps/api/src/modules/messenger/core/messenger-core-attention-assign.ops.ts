import { BadRequestException } from '@nestjs/common';
import type { PrismaClient, ProductCommunicationPurpose } from '@nbos/database';
import {
  MESSENGER_ATTENTION_OWNER_EMPLOYEE,
  MESSENGER_ATTENTION_OWNER_QUEUE,
  MESSENGER_ATTENTION_OWNER_ROLE,
  MESSENGER_ATTENTION_QUEUE_FINANCE,
  MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
  MESSENGER_ATTENTION_ROLE_PRODUCT_PM,
} from './messenger-core-attention.constants';
import {
  ATTENTION_PRODUCT_SELECT,
  computeDefaultAttention,
  type AttentionProductFacts,
} from './messenger-core-attention-default';
import { listConversationAttentions } from './messenger-core-attention.ops';
import { assertAttentionOwnerAllowed } from './messenger-core-attention-assign-validate';
import type { MessengerAttentionDto } from './messenger-core-attention.types';
import { PRODUCT_COMMUNICATION_PURPOSES } from './product-communication.constants';
import { bumpGlobalConversationRevision } from './messenger-core-revision-write.ops';
import { runMessengerWriteTx } from './messenger-core-revision-tx';

type PrismaLike = InstanceType<typeof PrismaClient>;

export type AssignConversationAttentionInput = {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  ownerKind: MessengerAttentionDto['ownerKind'];
  ownerEmployeeId?: string | null;
  ownerQueue?: MessengerAttentionDto['ownerQueue'];
  assignedById: string;
};

export async function assignConversationAttention(
  prisma: PrismaLike,
  input: AssignConversationAttentionInput,
): Promise<MessengerAttentionDto[]> {
  assertPurpose(input.purpose);
  await assertAttentionOwnerAllowed(prisma, input);
  const product = await loadBoundProduct(prisma, input);
  return runMessengerWriteTx(prisma, async (tx) => {
    if (shouldRestoreProductPmDefault(input, product)) {
      await tx.messengerConversationAttention.deleteMany({
        where: {
          conversationId: input.conversationId,
          productId: input.productId,
          purpose: input.purpose,
        },
      });
    } else {
      await upsertAttentionOverride(tx, input);
    }
    await bumpGlobalConversationRevision(tx, 'CLIENT', input.conversationId);
    return listConversationAttentions(tx, input.conversationId);
  });
}

function assertPurpose(purpose: ProductCommunicationPurpose): void {
  if ((PRODUCT_COMMUNICATION_PURPOSES as readonly string[]).includes(purpose)) return;
  throw new BadRequestException('Attention purpose must be WORK or FINANCE');
}

async function loadBoundProduct(prisma: PrismaLike, input: AssignConversationAttentionInput) {
  const binding = await prisma.productCommunicationBinding.findFirst({
    where: {
      conversationId: input.conversationId,
      productId: input.productId,
      purpose: input.purpose,
      status: 'ACTIVE',
    },
    select: { product: { select: ATTENTION_PRODUCT_SELECT } },
  });
  if (!binding) {
    throw new BadRequestException('Attention product and purpose must match an active binding');
  }
  return binding.product;
}

function shouldRestoreProductPmDefault(
  input: AssignConversationAttentionInput,
  product: AttentionProductFacts,
): boolean {
  if (input.ownerKind !== MESSENGER_ATTENTION_OWNER_ROLE) return false;
  const defaults = computeDefaultAttention({
    conversationId: input.conversationId,
    productId: input.productId,
    purpose: input.purpose,
    product,
  });
  return defaults.ownerKind === MESSENGER_ATTENTION_OWNER_ROLE;
}

async function upsertAttentionOverride(
  prisma: PrismaLike,
  input: AssignConversationAttentionInput,
): Promise<void> {
  const fields = resolveOwnerFields(input);
  await prisma.messengerConversationAttention.upsert({
    where: {
      conversationId_productId_purpose: {
        conversationId: input.conversationId,
        productId: input.productId,
        purpose: input.purpose,
      },
    },
    create: {
      conversationId: input.conversationId,
      productId: input.productId,
      purpose: input.purpose,
      assignedById: input.assignedById,
      ...fields,
    },
    update: { assignedById: input.assignedById, ...fields },
  });
}

function resolveOwnerFields(input: AssignConversationAttentionInput): {
  ownerKind: MessengerAttentionDto['ownerKind'];
  ownerEmployeeId: string | null;
  ownerQueue: MessengerAttentionDto['ownerQueue'];
  ownerRole: MessengerAttentionDto['ownerRole'];
} {
  if (input.ownerKind === MESSENGER_ATTENTION_OWNER_EMPLOYEE) {
    const ownerEmployeeId = input.ownerEmployeeId?.trim() || null;
    if (!ownerEmployeeId) {
      throw new BadRequestException('Employee attention requires ownerEmployeeId');
    }
    return {
      ownerKind: MESSENGER_ATTENTION_OWNER_EMPLOYEE,
      ownerEmployeeId,
      ownerQueue: null,
      ownerRole: null,
    };
  }
  if (input.ownerKind === MESSENGER_ATTENTION_OWNER_ROLE) {
    return {
      ownerKind: MESSENGER_ATTENTION_OWNER_ROLE,
      ownerEmployeeId: null,
      ownerQueue: null,
      ownerRole: MESSENGER_ATTENTION_ROLE_PRODUCT_PM,
    };
  }
  const ownerQueue = input.ownerQueue;
  if (
    ownerQueue !== MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE &&
    ownerQueue !== MESSENGER_ATTENTION_QUEUE_FINANCE
  ) {
    throw new BadRequestException('Queue attention requires Support Intake or Finance');
  }
  return {
    ownerKind: MESSENGER_ATTENTION_OWNER_QUEUE,
    ownerEmployeeId: null,
    ownerQueue,
    ownerRole: null,
  };
}
