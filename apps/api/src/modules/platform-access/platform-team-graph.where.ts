import type { Prisma } from '@nbos/database';

/**
 * Prisma filters for project/product participation used by Drive, Finance, and Tasks.
 * Combines {@link ProjectTeamMember} / {@link ProductTeamMember} with legacy FK graphs until FK bridge is retired.
 */
export function buildProductParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.ProductWhereInput {
  return {
    OR: [
      { teamMembers: { some: { employeeId: { in: scopedEmployeeIds } } } },
      { pmId: { in: scopedEmployeeIds } },
      { developerId: { in: scopedEmployeeIds } },
      { designerId: { in: scopedEmployeeIds } },
      { technicalSpecialistId: { in: scopedEmployeeIds } },
      { qaLeadId: { in: scopedEmployeeIds } },
    ],
  };
}

export function buildDealParticipationWhere(scopedEmployeeIds: string[]): Prisma.DealWhereInput {
  return {
    OR: [
      { sellerId: { in: scopedEmployeeIds } },
      { sellerAssistantId: { in: scopedEmployeeIds } },
      { pmId: { in: scopedEmployeeIds } },
    ],
  };
}

export function buildProjectParticipationWhere(
  scopedEmployeeIds: string[],
): Prisma.ProjectWhereInput {
  return {
    OR: [
      { teamMembers: { some: { employeeId: { in: scopedEmployeeIds } } } },
      { products: { some: buildProductParticipationWhere(scopedEmployeeIds) } },
      { extensions: { some: { assignedTo: { in: scopedEmployeeIds } } } },
      {
        orders: {
          some: {
            deal: buildDealParticipationWhere(scopedEmployeeIds),
          },
        },
      },
    ],
  };
}
