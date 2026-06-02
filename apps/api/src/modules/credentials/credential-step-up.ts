import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PrismaClient } from '@nbos/database';
import type { AuditService } from '../audit/audit.service';

export async function assertCredentialStepUpPassword(
  prisma: InstanceType<typeof PrismaClient>,
  auditService: AuditService,
  employeeId: string,
  stepUpPassword: string | undefined,
  purpose: string,
): Promise<void> {
  const password = stepUpPassword?.trim();
  if (!password) {
    throw new BadRequestException('stepUpPassword is required for high-risk action');
  }
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { passwordHash: true },
  });
  if (!employee?.passwordHash) {
    throw new NotFoundException(`Employee ${employeeId} not found`);
  }
  const ok = await argon2.verify(employee.passwordHash, password);
  if (!ok) {
    throw new BadRequestException('Invalid step-up password');
  }
  await auditService.log({
    entityType: 'credential',
    entityId: employeeId,
    action: 'credential.step_up_verified',
    userId: employeeId,
    changes: { purpose },
  });
}
