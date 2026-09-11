import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { loadOrderedSourceMessages } from './messenger-core-source-load';
import { createCoreMessageReference } from './messenger-core-reference.ops';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function attachTaskSourceReferences(
  prisma: PrismaLike,
  input: { sourceMessageIds: string[]; taskId: string; createdById: string },
): Promise<{ referenceIds: string[]; sourceMessageIds: string[]; createdConversation: false }> {
  const task = await prisma.task.findUnique({
    where: { id: input.taskId },
    select: { id: true, trashedAt: true },
  });
  if (!task || task.trashedAt) throw new NotFoundException('Task not found');
  const sources = await loadOrderedSourceMessages(prisma, input.sourceMessageIds);
  const referenceIds: string[] = [];
  for (const [index, source] of sources.entries()) {
    const created = await createCoreMessageReference(prisma, {
      sourceMessageId: source.id,
      targetEntityType: 'TASK',
      targetEntityId: task.id,
      purpose: 'TASK_SOURCE',
      sortOrder: index,
      createdById: input.createdById,
    });
    referenceIds.push(created.id);
  }
  return {
    referenceIds,
    sourceMessageIds: sources.map((row) => row.id),
    createdConversation: false,
  };
}
