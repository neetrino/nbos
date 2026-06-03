import type { Prisma, PrismaClient } from '@nbos/database';
import {
  buildDealParticipationWhere,
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from '../platform-access/platform-team-graph.where';
import type { DriveInheritedLinkTarget } from './drive-inherited-link-entity-groups';

export const INHERITED_LINK_ENTITY_CAP = 150;

function taskParticipationWhere(scopedEmployeeIds: string[]): Prisma.TaskWhereInput {
  return {
    OR: [
      { creatorId: { in: scopedEmployeeIds } },
      { assigneeId: { in: scopedEmployeeIds } },
      { coAssignees: { hasSome: scopedEmployeeIds } },
      { observers: { hasSome: scopedEmployeeIds } },
    ],
  };
}

function workspaceParticipationWhere(scopedEmployeeIds: string[]): Prisma.WorkSpaceWhereInput {
  return {
    OR: [
      { product: buildProductParticipationWhere(scopedEmployeeIds) },
      {
        extension: {
          OR: [
            { assignedTo: { in: scopedEmployeeIds } },
            { closedById: { in: scopedEmployeeIds } },
          ],
        },
      },
      { project: buildProjectParticipationWhere(scopedEmployeeIds) },
    ],
  };
}

export async function collectGeneralInheritedLinkTargets(
  prisma: InstanceType<typeof PrismaClient>,
  scopedEmployeeIds: string[],
): Promise<DriveInheritedLinkTarget[]> {
  const [projects, deals, products, tasks, workspaces] = await Promise.all([
    prisma.project.findMany({
      where: buildProjectParticipationWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.deal.findMany({
      where: buildDealParticipationWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.product.findMany({
      where: buildProductParticipationWhere(scopedEmployeeIds),
      select: { id: true, extensions: { select: { id: true }, take: 30 } },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.task.findMany({
      where: taskParticipationWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.workSpace.findMany({
      where: workspaceParticipationWhere(scopedEmployeeIds),
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
  ]);

  const targets: DriveInheritedLinkTarget[] = [];
  for (const row of projects) targets.push({ entityType: 'PROJECT', entityId: row.id });
  for (const row of deals) targets.push({ entityType: 'DEAL', entityId: row.id });
  for (const row of products) {
    targets.push({ entityType: 'PRODUCT', entityId: row.id });
    for (const extension of row.extensions) {
      targets.push({ entityType: 'EXTENSION', entityId: extension.id });
    }
  }
  for (const row of tasks) targets.push({ entityType: 'TASK', entityId: row.id });
  for (const row of workspaces) {
    targets.push({ entityType: 'WORK_SPACE', entityId: row.id });
  }
  return targets;
}

export async function collectFinanceInheritedLinkTargets(
  prisma: InstanceType<typeof PrismaClient>,
  scopedEmployeeIds: string[],
): Promise<DriveInheritedLinkTarget[]> {
  const projectWhere = buildProjectParticipationWhere(scopedEmployeeIds);
  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { projectId: { not: null }, project: projectWhere },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.payment.findMany({
      where: { invoice: { project: projectWhere } },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.expense.findMany({
      where: {
        OR: [{ project: projectWhere }, { expensePlan: { project: projectWhere } }],
      },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
  ]);

  const targets: DriveInheritedLinkTarget[] = [];
  for (const row of invoices) targets.push({ entityType: 'INVOICE', entityId: row.id });
  for (const row of payments) targets.push({ entityType: 'PAYMENT', entityId: row.id });
  for (const row of expenses) targets.push({ entityType: 'EXPENSE', entityId: row.id });
  return targets;
}

export async function collectLegalInheritedLinkTargets(
  prisma: InstanceType<typeof PrismaClient>,
  scopedEmployeeIds: string[],
): Promise<DriveInheritedLinkTarget[]> {
  const projectWhere = buildProjectParticipationWhere(scopedEmployeeIds);
  const dealWhere = buildDealParticipationWhere(scopedEmployeeIds);
  const [partners, companies, contacts, serviceRecords] = await Promise.all([
    prisma.partner.findMany({
      where: {
        OR: [
          { dealsAsSource: { some: dealWhere } },
          { orders: { some: { project: projectWhere } } },
          { subscriptions: { some: { project: projectWhere } } },
          { partnerAccruals: { some: { project: projectWhere } } },
        ],
      },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.company.findMany({
      where: {
        OR: [{ projects: { some: projectWhere } }, { deals: { some: dealWhere } }],
      },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.contact.findMany({
      where: {
        OR: [
          { projects: { some: projectWhere } },
          { deals: { some: dealWhere } },
          { leads: { some: { assignedTo: { in: scopedEmployeeIds } } } },
          { tickets: { some: { assignedTo: { in: scopedEmployeeIds } } } },
        ],
      },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
    prisma.clientServiceRecord.findMany({
      where: { project: projectWhere },
      select: { id: true },
      take: INHERITED_LINK_ENTITY_CAP,
    }),
  ]);

  const targets: DriveInheritedLinkTarget[] = [];
  for (const row of partners) targets.push({ entityType: 'PARTNER', entityId: row.id });
  for (const row of companies) targets.push({ entityType: 'COMPANY', entityId: row.id });
  for (const row of contacts) targets.push({ entityType: 'CONTACT', entityId: row.id });
  for (const row of serviceRecords) {
    targets.push({ entityType: 'CLIENT_SERVICE_RECORD', entityId: row.id });
  }
  return targets;
}
