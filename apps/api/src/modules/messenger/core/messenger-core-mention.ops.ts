import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { MESSENGER_CORE_MENTION_MAX_COUNT } from './messenger-core.constants';

type PrismaLike = InstanceType<typeof PrismaClient>;

export async function persistCoreMessageMentions(
  prisma: PrismaLike,
  messageId: string,
  mentionedEmployeeIds: string[] | undefined,
): Promise<string[]> {
  const uniqueIds = uniqueEmployeeIds(mentionedEmployeeIds);
  if (uniqueIds.length === 0) return [];
  await assertEmployeesExist(prisma, uniqueIds);
  await prisma.messengerMessageMention.createMany({
    data: uniqueIds.map((employeeId) => ({ messageId, employeeId })),
    skipDuplicates: true,
  });
  return uniqueIds;
}

function uniqueEmployeeIds(ids: string[] | undefined): string[] {
  const trimmed = (ids ?? []).map((id) => id.trim()).filter((id) => id.length > 0);
  const unique = [...new Set(trimmed)];
  if (unique.length > MESSENGER_CORE_MENTION_MAX_COUNT) {
    throw new BadRequestException('Too many mentioned employees');
  }
  return unique;
}

async function assertEmployeesExist(prisma: PrismaLike, employeeIds: string[]): Promise<void> {
  const rows = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true },
  });
  if (rows.length !== employeeIds.length) {
    throw new BadRequestException('Mentioned employee not found');
  }
}
