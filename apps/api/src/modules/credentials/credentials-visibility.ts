import type { Prisma } from '@nbos/database';
import type { PlatformTeamContext } from '../platform-access/platform-access-resolver.service';

export interface CredentialVisibilityContext {
  employeeId: string;
  departmentIds: string[];
  projectIds: string[];
  productIds: string[];
  manualGrantCredentialIds: string[];
}

/** Builds Prisma OR branches for credential row visibility (non–RBAC-bypass callers). */
export function buildCredentialVisibilityOr(
  ctx: CredentialVisibilityContext,
): Prisma.CredentialWhereInput[] {
  const branches: Prisma.CredentialWhereInput[] = [
    { accessLevel: 'ALL' },
    { accessLevel: 'PERSONAL', ownerId: ctx.employeeId },
  ];

  if (ctx.departmentIds.length > 0) {
    branches.push({
      accessLevel: 'DEPARTMENT',
      departmentId: { in: ctx.departmentIds },
    });
  }

  branches.push(buildProjectTeamVisibility(ctx));
  branches.push(buildSecretVisibility(ctx));

  return branches;
}

function buildProjectTeamVisibility(ctx: CredentialVisibilityContext): Prisma.CredentialWhereInput {
  const teamRules: Prisma.CredentialWhereInput[] = [];

  if (ctx.productIds.length > 0) {
    teamRules.push({ productId: { in: ctx.productIds } });
  }
  if (ctx.projectIds.length > 0) {
    teamRules.push({
      projectId: { in: ctx.projectIds },
      productId: null,
    });
  }

  teamRules.push(...legacyProjectTeamDeliveryOr(ctx.employeeId));

  return {
    accessLevel: 'PROJECT_TEAM',
    OR: teamRules,
  };
}

/** Legacy delivery graph until all participants live in team tables. */
function legacyProjectTeamDeliveryOr(employeeId: string): Prisma.CredentialWhereInput[] {
  return [
    {
      project: {
        products: {
          some: {
            OR: [
              { pmId: employeeId },
              { developerId: employeeId },
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
        orders: {
          some: {
            deal: {
              OR: [{ sellerId: employeeId }, { pmId: employeeId }],
            },
          },
        },
      },
    },
  ];
}

function buildSecretVisibility(ctx: CredentialVisibilityContext): Prisma.CredentialWhereInput {
  const secretOr: Prisma.CredentialWhereInput[] = [{ allowedEmployees: { has: ctx.employeeId } }];
  if (ctx.manualGrantCredentialIds.length > 0) {
    secretOr.push({ id: { in: ctx.manualGrantCredentialIds } });
  }
  return {
    accessLevel: 'SECRET',
    OR: secretOr,
  };
}

export function credentialVisibilityContextFromTeam(
  employeeId: string,
  departmentIds: string[],
  team: PlatformTeamContext,
  manualGrantCredentialIds: string[],
): CredentialVisibilityContext {
  return {
    employeeId,
    departmentIds,
    projectIds: team.projectIds,
    productIds: team.productIds,
    manualGrantCredentialIds,
  };
}
