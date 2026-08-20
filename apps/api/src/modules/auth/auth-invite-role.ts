import { ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  canAssignRole,
  CEO_ROLE_SLUG,
  evaluateIsPlatformOwner,
  PLATFORM_OWNERSHIP_SINGLETON_ID,
} from '@nbos/shared';

const ACTIVE_CEO_STATUSES = ['ACTIVE', 'PROBATION'] as const;

/** Re-check invitation role at accept time without importing PlatformOwnershipService. */
export async function assertInvitationRoleStillAssignable(
  prisma: InstanceType<typeof PrismaClient>,
  params: {
    invitedById: string;
    roleId: string;
    founderEmployeeIdEnv: string | null;
  },
): Promise<void> {
  const [targetRole, inviter, ownership] = await Promise.all([
    prisma.role.findUnique({
      where: { id: params.roleId },
      select: { slug: true, assignable: true },
    }),
    prisma.employee.findUnique({
      where: { id: params.invitedById },
      select: { id: true, status: true, role: { select: { slug: true } } },
    }),
    prisma.platformOwnership.findUnique({
      where: { id: PLATFORM_OWNERSHIP_SINGLETON_ID },
      select: { ownerEmployeeId: true },
    }),
  ]);
  if (!targetRole || !inviter) {
    throw new ForbiddenException('Invitation is no longer valid.');
  }
  const actorIsPlatformOwner = evaluateIsPlatformOwner({
    employeeId: inviter.id,
    employeeStatus: inviter.status,
    ownerEmployeeId: ownership?.ownerEmployeeId ?? null,
    founderEmployeeIdEnv: params.founderEmployeeIdEnv,
  }).ok;
  let ceoHeldByOtherEmployee = false;
  if (targetRole.slug.trim().toLowerCase() === CEO_ROLE_SLUG) {
    const existing = await prisma.employee.findFirst({
      where: {
        role: { slug: CEO_ROLE_SLUG },
        status: { in: [...ACTIVE_CEO_STATUSES] },
      },
      select: { id: true },
    });
    ceoHeldByOtherEmployee = Boolean(existing);
  }
  const decision = canAssignRole({
    actorIsPlatformOwner,
    actorRoleSlug: inviter.role.slug,
    targetRoleSlug: targetRole.slug,
    targetRoleAssignable: targetRole.assignable,
    ceoHeldByOtherEmployee,
  });
  if (!decision.allowed) throw new ForbiddenException(decision.reason);
}
