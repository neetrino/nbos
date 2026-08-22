import { ConflictException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';

/**
 * Optional optimistic lock: UPDATE … WHERE id AND updatedAt.
 * Human callers omit expectedUpdatedAt and keep the unconditional update.
 */
export async function commitTaskUpdate<TInclude extends Prisma.TaskInclude>(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    id: string;
    data: Prisma.TaskUpdateInput;
    include: TInclude;
    expectedUpdatedAt?: Date;
  },
) {
  if (!params.expectedUpdatedAt) {
    return prisma.task.update({
      where: { id: params.id },
      data: params.data,
      include: params.include,
    });
  }
  const written = await prisma.task.updateMany({
    where: { id: params.id, updatedAt: params.expectedUpdatedAt, trashedAt: null },
    data: params.data,
  });
  if (written.count !== 1) {
    throw new ConflictException('The task has changed since it was last read.');
  }
  return prisma.task.findUniqueOrThrow({
    where: { id: params.id },
    include: params.include,
  });
}
