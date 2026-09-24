import { BadRequestException } from '@nestjs/common';
import type { PrismaClient } from '@nbos/database';

export const EMPLOYEE_PERSON_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

export const RESPONSIBLE_EMPLOYEE_NOT_FOUND = 'RESPONSIBLE_EMPLOYEE_NOT_FOUND';

/** `undefined` = omit; `null` = clear; id = set after existence check. */
export async function normalizeResponsibleEmployeeId(
  prisma: InstanceType<typeof PrismaClient>,
  raw: string | null | undefined,
): Promise<string | null | undefined> {
  if (raw === undefined) return undefined;
  if (raw === null || raw.trim() === '') return null;
  const id = raw.trim();
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!employee) {
    throw new BadRequestException({
      statusCode: 400,
      code: RESPONSIBLE_EMPLOYEE_NOT_FOUND,
      message: `Employee ${id} was not found.`,
      errors: [{ field: 'responsibleEmployeeId', message: 'Unknown employee id' }],
    });
  }
  return id;
}

export function resolveMergedResponsibleEmployeeId(
  survivorId: string | null | undefined,
  absorbedId: string | null | undefined,
): string | null {
  return survivorId ?? absorbedId ?? null;
}
