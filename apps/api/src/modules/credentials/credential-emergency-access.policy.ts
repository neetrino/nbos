import { ForbiddenException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';
import { EMERGENCY_ACCESS_ROLE_SLUGS } from './credential-emergency-access.constants';

export async function assertEmergencyAccessRole(
  prisma: InstanceType<typeof PrismaClient>,
  employeeId: string,
): Promise<void> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { role: { select: { slug: true } } },
  });
  const slug = employee?.role.slug?.toLowerCase();
  if (
    !slug ||
    !EMERGENCY_ACCESS_ROLE_SLUGS.includes(slug as (typeof EMERGENCY_ACCESS_ROLE_SLUGS)[number])
  ) {
    throw new ForbiddenException('Emergency access is limited to executive roles');
  }
}
