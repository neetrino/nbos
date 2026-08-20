import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

type ReportsPrisma = Pick<InstanceType<typeof PrismaClient>, 'reportSchedule'>;

export async function attachExportJobToOwnedSchedule(
  prisma: ReportsPrisma,
  input: { scheduleId: string; exportJobId: string; ownerId: string },
): Promise<void> {
  const schedule = await prisma.reportSchedule.findFirst({
    where: { id: input.scheduleId, ownerId: input.ownerId },
    select: { id: true, status: true },
  });
  if (!schedule) throw new NotFoundException('Report schedule was not found.');
  if (schedule.status === 'ARCHIVED') {
    throw new BadRequestException('Archived report schedules cannot create files.');
  }
  await prisma.reportSchedule.update({
    where: { id: schedule.id },
    data: { lastExportJobId: input.exportJobId },
  });
}
