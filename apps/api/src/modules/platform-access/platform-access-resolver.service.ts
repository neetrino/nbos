import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, type PlatformResourceFamilyEnum } from '@nbos/database';
import type { AccessScopeMode, PlatformResourceFamily } from '@nbos/shared';
import { PRISMA_TOKEN } from '../../database.module';

export interface PlatformTeamContext {
  projectIds: string[];
  productIds: string[];
  projectAdminProjectIds: string[];
}

/**
 * Loads project/product team membership for entity-level access (Credentials Phase 2+).
 */
@Injectable()
export class PlatformAccessResolverService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async loadTeamContext(employeeId: string): Promise<PlatformTeamContext> {
    const [projectRows, productRows] = await Promise.all([
      this.prisma.projectTeamMember.findMany({
        where: { employeeId },
        select: { projectId: true, role: true },
      }),
      this.prisma.productTeamMember.findMany({
        where: { employeeId },
        select: { productId: true },
      }),
    ]);

    return {
      projectIds: [...new Set(projectRows.map((r) => r.projectId))],
      productIds: [...new Set(productRows.map((r) => r.productId))],
      projectAdminProjectIds: projectRows.filter((r) => r.role === 'ADMIN').map((r) => r.projectId),
    };
  }

  /** Phase 1 stub: team membership check for assigned-scope modules. */
  employeeInProjectTeam(ctx: PlatformTeamContext, projectId: string | null | undefined): boolean {
    if (!projectId) return false;
    return ctx.projectIds.includes(projectId);
  }

  employeeInProductTeam(ctx: PlatformTeamContext, productId: string | null | undefined): boolean {
    if (!productId) return false;
    return ctx.productIds.includes(productId);
  }

  /** Resolves effective scope mode: personal override → role policy → ASSIGNED default. */
  async resolveScopeModeForFamily(
    employeeId: string,
    family: PlatformResourceFamily,
  ): Promise<AccessScopeMode> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { roleId: true },
    });
    if (!employee) return 'NONE';

    const familyKey = family as PlatformResourceFamilyEnum;
    const override = await this.prisma.employeeAccessOverride.findUnique({
      where: {
        employeeId_resourceFamily: { employeeId, resourceFamily: familyKey },
      },
      select: { scopeMode: true, effectiveFrom: true, effectiveTo: true },
    });
    if (override && this.isOverrideActive(override)) {
      return (override.scopeMode as AccessScopeMode | null) ?? 'ASSIGNED';
    }

    const rolePolicy = await this.prisma.roleAccessPolicy.findUnique({
      where: {
        roleId_resourceFamily: { roleId: employee.roleId, resourceFamily: familyKey },
      },
      select: { scopeMode: true },
    });
    if (rolePolicy) return rolePolicy.scopeMode as AccessScopeMode;
    return 'ASSIGNED';
  }

  private isOverrideActive(override: {
    effectiveFrom: Date | null;
    effectiveTo: Date | null;
  }): boolean {
    const now = Date.now();
    if (override.effectiveFrom && override.effectiveFrom.getTime() > now) return false;
    if (override.effectiveTo && override.effectiveTo.getTime() < now) return false;
    return true;
  }
}
