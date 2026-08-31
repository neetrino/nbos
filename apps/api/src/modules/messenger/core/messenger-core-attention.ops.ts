import type { PrismaClient, ProductCommunicationPurpose } from '@nbos/database';
import {
  ATTENTION_PRODUCT_SELECT,
  attentionLabel,
  computeDefaultAttention,
  type AttentionProductFacts,
} from './messenger-core-attention-default';
import { MESSENGER_ATTENTION_OWNER_ROLE } from './messenger-core-attention.constants';
import type { MessengerAttentionDto } from './messenger-core-attention.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

type ManualRow = {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  ownerKind: MessengerAttentionDto['ownerKind'];
  ownerEmployeeId: string | null;
  ownerQueue: MessengerAttentionDto['ownerQueue'];
  ownerRole: MessengerAttentionDto['ownerRole'];
};

type BindingRow = {
  conversationId: string;
  productId: string;
  purpose: ProductCommunicationPurpose;
  product: AttentionProductFacts;
};

export async function listConversationAttentions(
  prisma: PrismaLike,
  conversationId: string,
): Promise<MessengerAttentionDto[]> {
  const [bindings, manuals] = await Promise.all([
    loadBindings(prisma, conversationId),
    loadManuals(prisma, conversationId),
  ]);
  return mergeAttentions(conversationId, bindings, manuals);
}

export function mergeAttentions(
  conversationId: string,
  bindings: BindingRow[],
  manuals: ManualRow[],
): MessengerAttentionDto[] {
  const manualByScope = new Map(
    manuals.map((row) => [`${row.productId}:${row.purpose}`, row] as const),
  );
  return bindings.map((binding) => {
    const manual = manualByScope.get(`${binding.productId}:${binding.purpose}`);
    if (manual) return toManualDto(manual, binding.product);
    return computeDefaultAttention({
      conversationId,
      productId: binding.productId,
      purpose: binding.purpose,
      product: binding.product,
    });
  });
}

export function attentionAssignsEmployee(
  row: MessengerAttentionDto,
  employeeId: string,
  queueEmployeeIds: ReadonlySet<string>,
): boolean {
  if (row.ownerKind === 'EMPLOYEE') return row.ownerEmployeeId === employeeId;
  if (row.ownerKind === 'ROLE') return row.ownerEmployeeId === employeeId;
  if (!row.ownerQueue) return false;
  return queueEmployeeIds.has(employeeId);
}

async function loadBindings(prisma: PrismaLike, conversationId: string): Promise<BindingRow[]> {
  return prisma.productCommunicationBinding.findMany({
    where: { conversationId, status: 'ACTIVE' },
    select: {
      conversationId: true,
      productId: true,
      purpose: true,
      product: { select: ATTENTION_PRODUCT_SELECT },
    },
  });
}

async function loadManuals(prisma: PrismaLike, conversationId: string): Promise<ManualRow[]> {
  return prisma.messengerConversationAttention.findMany({
    where: { conversationId },
    select: {
      conversationId: true,
      productId: true,
      purpose: true,
      ownerKind: true,
      ownerEmployeeId: true,
      ownerQueue: true,
      ownerRole: true,
    },
  });
}

function toManualDto(row: ManualRow, product: AttentionProductFacts): MessengerAttentionDto {
  const base = {
    conversationId: row.conversationId,
    productId: row.productId,
    purpose: row.purpose,
    productName: product.name,
    ownerKind: row.ownerKind,
    ownerEmployeeId: roleOwnerEmployeeId(row, product),
    ownerQueue: row.ownerQueue,
    ownerRole: row.ownerRole,
    isManual: true,
  };
  return { ...base, label: attentionLabel(base) };
}

function roleOwnerEmployeeId(row: ManualRow, product: AttentionProductFacts): string | null {
  if (row.ownerKind !== MESSENGER_ATTENTION_OWNER_ROLE) return row.ownerEmployeeId;
  return product.pmId ?? row.ownerEmployeeId;
}
