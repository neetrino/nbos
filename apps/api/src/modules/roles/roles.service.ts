import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PLATFORM_OWNER_ROLE_SLUG } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';

interface RoleEmployeeCount {
  roleId: string;
  employeeCount: number;
}

@Injectable()
export class RolesService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    const now = new Date();
    const [roles, counts] = await Promise.all([
      this.prisma.role.findMany({ orderBy: { level: 'asc' } }),
      this.prisma.$queryRaw<RoleEmployeeCount[]>`
        SELECT grants."roleId", COUNT(DISTINCT grants."employeeId")::int AS "employeeCount"
        FROM (
          SELECT "id" AS "employeeId", "role_id" AS "roleId"
          FROM "employees"
          UNION ALL
          SELECT "employee_id" AS "employeeId", "role_id" AS "roleId"
          FROM "permission_role_assignments"
          WHERE "revoked_at" IS NULL
            AND "effective_from" <= ${now}
            AND ("effective_to" IS NULL OR "effective_to" > ${now})
        ) grants
        GROUP BY grants."roleId"
      `,
    ]);
    const countByRoleId = new Map(counts.map((row) => [row.roleId, row.employeeCount]));
    return roles.map((role) => ({
      ...role,
      _count: { employees: countByRoleId.get(role.id) ?? 0 },
    }));
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async create(
    data: { name: string; slug: string; description?: string; level: number },
    actorId: string,
  ) {
    if (data.slug.trim().toLowerCase() === PLATFORM_OWNER_ROLE_SLUG) {
      throw new BadRequestException('Platform Owner is not a creatable role.');
    }
    const role = await this.prisma.role.create({
      data: {
        ...data,
        isSystem: false,
      },
    });
    await this.logRoleChange('ROLE_CREATED', role.id, actorId, {
      after: this.toRoleAuditSnapshot(role),
    });
    return role;
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; description?: string; level?: number },
    actorId: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot update system role');
    }
    if (data.slug?.trim().toLowerCase() === PLATFORM_OWNER_ROLE_SLUG) {
      throw new BadRequestException('Platform Owner is not a creatable role.');
    }
    const updated = await this.prisma.role.update({
      where: { id },
      data,
    });
    await this.logRoleChange('ROLE_UPDATED', id, actorId, {
      before: this.toRoleAuditSnapshot(role),
      after: this.toRoleAuditSnapshot(updated),
    });
    return updated;
  }

  async updatePermissions(
    roleId: string,
    permissions: Array<{ permissionId: string; scope: string }>,
    actorId: string,
  ) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const before = await this.findById(roleId);
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId,
          permissionId: p.permissionId,
          scope: p.scope,
        })),
      }),
      this.prisma.employee.updateMany({
        where: {
          OR: [{ roleId }, { permissionRoleAssignments: { some: { roleId } } }],
        },
        data: { accessVersion: { increment: 1 } },
      }),
    ]);

    const after = await this.findById(roleId);
    await this.logRoleChange('ROLE_PERMISSIONS_UPDATED', roleId, actorId, {
      before: this.toPermissionAuditSnapshot(before.permissions),
      after: this.toPermissionAuditSnapshot(after.permissions),
    });
    return after;
  }

  async remove(id: string, actorId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { employees: true, assignments: true, defaultForSeats: true } },
      },
    });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }
    if (role._count.employees > 0) {
      throw new BadRequestException('Cannot delete role with assigned employees');
    }
    if (role._count.assignments > 0) {
      throw new BadRequestException('Cannot delete role with authorization assignment history');
    }
    if (role._count.defaultForSeats > 0) {
      throw new BadRequestException('Cannot delete role mapped to organization seats');
    }
    const deleted = await this.prisma.role.delete({ where: { id } });
    await this.logRoleChange('ROLE_DELETED', id, actorId, {
      before: this.toRoleAuditSnapshot(role),
    });
    return deleted;
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  private async logRoleChange(
    action: string,
    entityId: string,
    userId: string,
    changes: InputJsonValue,
  ) {
    await this.auditService.log({
      entityType: 'Role',
      entityId,
      action,
      userId,
      changes,
    });
  }

  private toRoleAuditSnapshot(role: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    isSystem: boolean;
  }): InputJsonValue {
    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      level: role.level,
      isSystem: role.isSystem,
    };
  }

  private toPermissionAuditSnapshot(
    permissions: Array<{ scope: string; permission: { module: string; action: string } }>,
  ): InputJsonValue {
    return permissions.map((item) => ({
      module: item.permission.module,
      action: item.permission.action,
      scope: item.scope,
    }));
  }
}
