import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { PlatformResourceFamily } from '@nbos/shared';
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

  /**
   * Placeholder for Role/Personal policy resolution (Phase 1c).
   * Returns ASSIGNED until policy tables are populated from Settings UI.
   */
  resolveScopeModeForFamily(
    _employeeId: string,
    _roleId: string,
    _family: PlatformResourceFamily,
  ): 'ALL' | 'ASSIGNED' | 'NONE' {
    return 'ASSIGNED';
  }
}
