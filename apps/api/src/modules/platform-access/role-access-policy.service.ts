import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type PlatformResourceFamilyEnum,
  type PlatformAccessActionEnum,
  type AccessScopeModeEnum,
} from '@nbos/database';
import { PLATFORM_RESOURCE_FAMILIES, type PlatformResourceFamily } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';

export interface RoleAccessPolicyDto {
  resourceFamily: PlatformResourceFamily;
  defaultLevel: PlatformAccessActionEnum;
  scopeMode: AccessScopeModeEnum;
}

interface UpsertRolePoliciesInput {
  policies: RoleAccessPolicyDto[];
  changeReason?: string | null;
}

@Injectable()
export class RoleAccessPolicyService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async listByRole(roleId: string) {
    await this.assertRoleExists(roleId);
    const stored = await this.prisma.roleAccessPolicy.findMany({
      where: { roleId },
      orderBy: { resourceFamily: 'asc' },
    });
    const byFamily = new Map(stored.map((row) => [row.resourceFamily, row]));
    return PLATFORM_RESOURCE_FAMILIES.map((family) => {
      const row = byFamily.get(family as PlatformResourceFamilyEnum);
      return {
        resourceFamily: family,
        defaultLevel: row?.defaultLevel ?? 'VIEW',
        scopeMode: row?.scopeMode ?? 'ASSIGNED',
        persisted: Boolean(row),
      };
    });
  }

  async upsertForRole(roleId: string, input: UpsertRolePoliciesInput, actorId: string) {
    await this.assertRoleExists(roleId);
    const before = await this.listByRole(roleId);

    await this.prisma.$transaction(
      input.policies.map((policy) =>
        this.prisma.roleAccessPolicy.upsert({
          where: {
            roleId_resourceFamily: {
              roleId,
              resourceFamily: policy.resourceFamily as PlatformResourceFamilyEnum,
            },
          },
          create: {
            roleId,
            resourceFamily: policy.resourceFamily as PlatformResourceFamilyEnum,
            defaultLevel: policy.defaultLevel,
            scopeMode: policy.scopeMode,
            updatedById: actorId,
          },
          update: {
            defaultLevel: policy.defaultLevel,
            scopeMode: policy.scopeMode,
            updatedById: actorId,
          },
        }),
      ),
    );

    const after = await this.listByRole(roleId);
    await this.audit.log({
      entityType: 'role',
      entityId: roleId,
      action: 'role.access_policy.updated',
      userId: actorId,
      changes: {
        before,
        after,
        changeReason: input.changeReason?.trim() || null,
      },
    });
    return after;
  }

  private async assertRoleExists(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);
  }
}
