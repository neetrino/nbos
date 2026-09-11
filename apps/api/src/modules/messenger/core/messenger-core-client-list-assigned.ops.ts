import type { Prisma, PrismaClient, ProductCommunicationPurpose } from '@nbos/database';
import {
  productNotOnMaintenanceWhere,
  productOnMaintenanceWhere,
} from '../../projects/product-maintenance-view';
import {
  MESSENGER_ATTENTION_OWNER_EMPLOYEE,
  MESSENGER_ATTENTION_OWNER_QUEUE,
  MESSENGER_ATTENTION_OWNER_ROLE,
  MESSENGER_ATTENTION_QUEUE_FINANCE,
  MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
  MESSENGER_ATTENTION_ROLE_PRODUCT_PM,
} from './messenger-core-attention.constants';
import { listAttentionQueueEmployeeIds } from './messenger-core-attention-queue.ops';
import type { MessengerAttentionQueue } from './messenger-core-attention.types';
import { PRODUCT_COMMUNICATION_PURPOSE_FINANCE } from './product-communication.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listAssignedConversationIds(
  prisma: PrismaLike,
  employeeId: string,
  accessWhere: Prisma.MessengerConversationWhereInput,
): Promise<string[]> {
  const myQueues = await queuesForEmployee(prisma, employeeId);
  const [manualIds, defaultIds] = await Promise.all([
    idsFromManualAttention(prisma, employeeId, myQueues, accessWhere),
    idsFromDefaultAttention(prisma, employeeId, myQueues, accessWhere),
  ]);
  return [...new Set([...manualIds, ...defaultIds])];
}

async function queuesForEmployee(
  prisma: PrismaLike,
  employeeId: string,
): Promise<MessengerAttentionQueue[]> {
  const [support, finance] = await Promise.all([
    listAttentionQueueEmployeeIds(prisma, MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE),
    listAttentionQueueEmployeeIds(prisma, MESSENGER_ATTENTION_QUEUE_FINANCE),
  ]);
  const queues: MessengerAttentionQueue[] = [];
  if (support.includes(employeeId)) queues.push(MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE);
  if (finance.includes(employeeId)) queues.push(MESSENGER_ATTENTION_QUEUE_FINANCE);
  return queues;
}

async function idsFromManualAttention(
  prisma: PrismaLike,
  employeeId: string,
  myQueues: MessengerAttentionQueue[],
  accessWhere: Prisma.MessengerConversationWhereInput,
): Promise<string[]> {
  const rows = await prisma.messengerConversationAttention.findMany({
    where: {
      conversation: accessWhere,
      OR: manualAttentionOr(employeeId, myQueues),
    },
    select: { conversationId: true },
  });
  return [...new Set(rows.map((row) => row.conversationId))];
}

function manualAttentionOr(
  employeeId: string,
  myQueues: MessengerAttentionQueue[],
): Prisma.MessengerConversationAttentionWhereInput[] {
  const clauses: Prisma.MessengerConversationAttentionWhereInput[] = [
    { ownerKind: MESSENGER_ATTENTION_OWNER_EMPLOYEE, ownerEmployeeId: employeeId },
    {
      ownerKind: MESSENGER_ATTENTION_OWNER_ROLE,
      ownerRole: MESSENGER_ATTENTION_ROLE_PRODUCT_PM,
      product: { pmId: employeeId },
    },
  ];
  if (myQueues.length === 0) return clauses;
  clauses.push({
    ownerKind: MESSENGER_ATTENTION_OWNER_QUEUE,
    ownerQueue: { in: myQueues },
  });
  return clauses;
}

async function idsFromDefaultAttention(
  prisma: PrismaLike,
  employeeId: string,
  myQueues: MessengerAttentionQueue[],
  accessWhere: Prisma.MessengerConversationWhereInput,
): Promise<string[]> {
  const clauses = defaultBindingOr(employeeId, myQueues);
  if (clauses.length === 0) return [];
  const bindings = await prisma.productCommunicationBinding.findMany({
    where: { status: 'ACTIVE', conversation: accessWhere, OR: clauses },
    select: { conversationId: true, productId: true, purpose: true },
  });
  return bindingsWithoutOverride(prisma, bindings);
}

function defaultBindingOr(
  employeeId: string,
  myQueues: MessengerAttentionQueue[],
): Prisma.ProductCommunicationBindingWhereInput[] {
  const clauses: Prisma.ProductCommunicationBindingWhereInput[] = [
    {
      purpose: 'WORK',
      product: {
        pmId: employeeId,
        ...productNotOnMaintenanceWhere(),
      },
    },
  ];
  if (myQueues.includes(MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE)) {
    clauses.push({
      purpose: 'WORK',
      product: productOnMaintenanceWhere(),
    });
  }
  if (myQueues.includes(MESSENGER_ATTENTION_QUEUE_FINANCE)) {
    clauses.push({ purpose: PRODUCT_COMMUNICATION_PURPOSE_FINANCE });
  }
  return clauses;
}

async function bindingsWithoutOverride(
  prisma: PrismaLike,
  bindings: Array<{
    conversationId: string;
    productId: string;
    purpose: ProductCommunicationPurpose;
  }>,
): Promise<string[]> {
  if (bindings.length === 0) return [];
  const manuals = await prisma.messengerConversationAttention.findMany({
    where: { conversationId: { in: bindings.map((row) => row.conversationId) } },
    select: { conversationId: true, productId: true, purpose: true },
  });
  const blocked = new Set(
    manuals.map((row) => `${row.conversationId}:${row.productId}:${row.purpose}`),
  );
  return [
    ...new Set(
      bindings
        .filter((row) => !blocked.has(`${row.conversationId}:${row.productId}:${row.purpose}`))
        .map((row) => row.conversationId),
    ),
  ];
}
