import type { PrismaClient } from '@nbos/database';
import {
  ATTENTION_QUEUE_PERMISSION_ACTION,
  ATTENTION_QUEUE_PERMISSION_SCOPE,
  MESSENGER_ATTENTION_QUEUE_FINANCE,
  MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE,
} from './messenger-core-attention.constants';
import type { MessengerAttentionQueue } from './messenger-core-attention.types';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function listAttentionQueueEmployeeIds(
  prisma: PrismaLike,
  queue: MessengerAttentionQueue,
): Promise<string[]> {
  const module =
    queue === MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE ? 'SUPPORT_TICKETS' : 'FINANCE_INVOICES';
  const rows = await prisma.employee.findMany({
    where: {
      status: { not: 'TERMINATED' },
      role: {
        permissions: {
          some: {
            scope: ATTENTION_QUEUE_PERMISSION_SCOPE,
            permission: { module, action: ATTENTION_QUEUE_PERMISSION_ACTION },
          },
        },
      },
    },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

export async function loadAssignedQueueEmployeeIds(prisma: PrismaLike): Promise<Set<string>> {
  const [support, finance] = await Promise.all([
    listAttentionQueueEmployeeIds(prisma, MESSENGER_ATTENTION_QUEUE_SUPPORT_INTAKE),
    listAttentionQueueEmployeeIds(prisma, MESSENGER_ATTENTION_QUEUE_FINANCE),
  ]);
  return new Set([...support, ...finance]);
}
