import { NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { getMailThreadDetailDtoOrNull } from './mail-inbox-query.ops';
import type { MailThreadDetailDto } from './mail.types';

export async function requireMailThreadDetailDto(
  prisma: InstanceType<typeof PrismaClient>,
  params: { employeeId: string; viewScope: string; threadId: string },
): Promise<MailThreadDetailDto> {
  const dto = await getMailThreadDetailDtoOrNull(prisma, {
    employeeId: params.employeeId,
    viewScope: params.viewScope,
    threadId: params.threadId,
  });
  if (!dto) {
    throw new NotFoundException('Thread not found');
  }
  return dto;
}
