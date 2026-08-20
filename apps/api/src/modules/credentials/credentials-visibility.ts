import type { Prisma } from '@nbos/database';
import type { PlatformTeamContext } from '../platform-access/platform-access-resolver.service';

const OPERATIONAL_CONFIDENTIALITY: Prisma.CredentialWhereInput = {
  confidentiality: { notIn: ['RESTRICTED', 'OWNER_ONLY'] },
};

export interface CredentialVisibilityContext {
  employeeId: string;
  departmentIds: string[];
  projectIds: string[];
  productIds: string[];
  manualGrantCredentialIds: string[];
  executiveProjectAccess: boolean;
}

export function buildCredentialVisibilityOr(
  ctx: CredentialVisibilityContext,
): Prisma.CredentialWhereInput[] {
  return ctx.executiveProjectAccess ? buildCeoVisibilityOr(ctx) : buildMemberVisibilityOr(ctx);
}

function buildMemberVisibilityOr(ctx: CredentialVisibilityContext): Prisma.CredentialWhereInput[] {
  const branches: Prisma.CredentialWhereInput[] = [
    andOperational({ accessLevel: 'ALL' }),
    andOperational({ accessLevel: 'PERSONAL', ownerId: ctx.employeeId }),
  ];
  if (ctx.departmentIds.length > 0) {
    branches.push(
      andOperational({
        accessLevel: 'DEPARTMENT',
        departmentId: { in: ctx.departmentIds },
      }),
    );
  }
  branches.push(andOperational(buildProjectTeamVisibility(ctx)));
  branches.push(buildSecretOrGrantVisibility(ctx));
  return branches;
}

function buildCeoVisibilityOr(ctx: CredentialVisibilityContext): Prisma.CredentialWhereInput[] {
  const branches: Prisma.CredentialWhereInput[] = [
    andOperational({ accessLevel: 'ALL' }),
    andOperational({ accessLevel: 'PERSONAL', ownerId: ctx.employeeId }),
    andOperational({ accessLevel: 'PROJECT_TEAM' }),
  ];
  if (ctx.departmentIds.length > 0) {
    branches.push(
      andOperational({
        accessLevel: 'DEPARTMENT',
        departmentId: { in: ctx.departmentIds },
      }),
    );
  }
  branches.push(buildSecretOrGrantVisibility(ctx));
  return branches;
}

function andOperational(branch: Prisma.CredentialWhereInput): Prisma.CredentialWhereInput {
  return { AND: [branch, OPERATIONAL_CONFIDENTIALITY] };
}

function buildProjectTeamVisibility(ctx: CredentialVisibilityContext): Prisma.CredentialWhereInput {
  const teamRules: Prisma.CredentialWhereInput[] = [];
  if (ctx.productIds.length > 0) {
    teamRules.push({ productId: { in: ctx.productIds } });
  }
  if (ctx.projectIds.length > 0) {
    teamRules.push({ projectId: { in: ctx.projectIds }, productId: null });
  }
  teamRules.push(...legacyProjectTeamDeliveryOr(ctx.employeeId));
  return { accessLevel: 'PROJECT_TEAM', OR: teamRules };
}

function legacyProjectTeamDeliveryOr(employeeId: string): Prisma.CredentialWhereInput[] {
  return [
    {
      project: {
        products: {
          some: {
            OR: [
              { pmId: employeeId },
              { developerId: employeeId },
              { frontendDeveloperId: employeeId },
              { designerId: employeeId },
              { technicalSpecialistId: employeeId },
              { qaLeadId: employeeId },
            ],
          },
        },
      },
    },
    { project: { extensions: { some: { assignedTo: employeeId } } } },
    {
      project: {
        orders: { some: { deal: { OR: [{ sellerId: employeeId }, { pmId: employeeId }] } } },
      },
    },
  ];
}

function buildSecretOrGrantVisibility(
  ctx: CredentialVisibilityContext,
): Prisma.CredentialWhereInput {
  const grantOr: Prisma.CredentialWhereInput[] = [{ allowedEmployees: { has: ctx.employeeId } }];
  const extra: Prisma.CredentialWhereInput[] = [{ accessLevel: 'SECRET', OR: grantOr }];
  if (ctx.manualGrantCredentialIds.length > 0) {
    grantOr.push({ id: { in: ctx.manualGrantCredentialIds } });
    extra.push({ id: { in: ctx.manualGrantCredentialIds } });
  }
  return {
    confidentiality: { not: 'OWNER_ONLY' },
    OR: extra,
  };
}

export function credentialVisibilityContextFromTeam(
  employeeId: string,
  departmentIds: string[],
  team: PlatformTeamContext,
  manualGrantCredentialIds: string[],
  executiveProjectAccess = false,
): CredentialVisibilityContext {
  return {
    employeeId,
    departmentIds,
    projectIds: team.projectIds,
    productIds: team.productIds,
    manualGrantCredentialIds,
    executiveProjectAccess,
  };
}
