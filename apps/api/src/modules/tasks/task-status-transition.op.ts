import { BadRequestException } from '@nestjs/common';
import { PrismaClient, type TaskStatusEnum } from '@nbos/database';

export const TASK_START_FROM_STATUSES: readonly TaskStatusEnum[] = ['OPEN', 'ON_HOLD'];

export const TASK_SUBMIT_REVIEW_FROM_STATUSES: readonly TaskStatusEnum[] = [
  'OPEN',
  'IN_PROGRESS',
  'ON_HOLD',
];

/**
 * Status change is a single UPDATE … WHERE status IN allowed.
 * A concurrent complete/other transition yields count 0 instead of a silent overwrite.
 */
export async function applyTaskStatusTransition(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    id: string;
    from: readonly TaskStatusEnum[];
    data: {
      status: TaskStatusEnum;
      reviewRequestedAt?: Date;
      reviewApprovedAt?: Date | null;
      reviewerId?: string | null;
    };
    invalidMessage: string;
  },
): Promise<void> {
  const written = await prisma.task.updateMany({
    where: { id: params.id, status: { in: [...params.from] }, trashedAt: null },
    data: params.data,
  });
  if (written.count !== 1) {
    throw new BadRequestException(params.invalidMessage);
  }
}
