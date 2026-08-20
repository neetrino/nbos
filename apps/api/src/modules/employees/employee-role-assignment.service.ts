import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';

const ROLE_SELECT = {
  id: true,
  name: true,
  slug: true,
  level: true,
  assignable: true,
} as const;

@Injectable()
export class EmployeeRoleAssignmentService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly ownership: PlatformOwnershipService,
  ) {}

  async createEmployee(
    actor: CurrentUserPayload,
    body: {
      firstName: string;
      lastName: string;
      email: string;
      roleId: string;
      phone?: string;
      telegram?: string;
      position?: string;
    },
  ) {
    await this.ownership.assertCanAssignRole({
      actorId: actor.id,
      actorRoleSlug: actor.role,
      targetEmployeeId: null,
      targetRoleId: body.roleId,
    });
    return this.prisma.employee.create({
      data: body,
      include: {
        role: { select: ROLE_SELECT },
        departments: { include: { department: true } },
      },
    });
  }

  async changeRole(actor: CurrentUserPayload, employeeId: string, roleId: string) {
    await this.ownership.assertFounderNotTarget(employeeId);
    await this.ownership.assertCanAssignRole({
      actorId: actor.id,
      actorRoleSlug: actor.role,
      targetEmployeeId: employeeId,
      targetRoleId: roleId,
    });
    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { roleId },
      include: { role: { select: ROLE_SELECT } },
    });
  }

  async assertInvitationRole(actor: CurrentUserPayload, roleId: string): Promise<void> {
    await this.ownership.assertCanAssignRole({
      actorId: actor.id,
      actorRoleSlug: actor.role,
      targetEmployeeId: null,
      targetRoleId: roleId,
    });
  }

  async assertInvitationAccept(invitedById: string, roleId: string): Promise<void> {
    const inviter = await this.prisma.employee.findUnique({
      where: { id: invitedById },
      select: { id: true, role: { select: { slug: true } } },
    });
    if (!inviter) throw new ForbiddenException('Invitation inviter is no longer valid.');
    await this.ownership.assertCanAssignRole({
      actorId: inviter.id,
      actorRoleSlug: inviter.role.slug,
      targetEmployeeId: null,
      targetRoleId: roleId,
    });
  }
}
