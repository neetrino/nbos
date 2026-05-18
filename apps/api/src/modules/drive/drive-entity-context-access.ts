import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import {
  employeeCanReadDocumentRow,
  normalizeDocumentsViewScope,
  resolveDocumentsReadContext,
} from '../documents/documents-access-read';
import type { DriveEntityContextAccess } from './drive-access.types';
import { requireText } from './drive-metadata';

const SCOPE_ALL = 'ALL';
const SCOPE_DEPARTMENT = 'DEPARTMENT';
const SCOPE_OWN = 'OWN';

function normalizeDriveScope(scope: string | undefined): string {
  return scope?.trim().toUpperCase() ?? 'NONE';
}

async function loadScopedEmployeeIds(
  prisma: InstanceType<typeof PrismaClient>,
  access: DriveEntityContextAccess,
): Promise<Set<string>> {
  const ids = new Set<string>([access.employeeId]);
  if (
    normalizeDriveScope(access.driveScope) !== SCOPE_DEPARTMENT ||
    access.departmentIds.length === 0
  ) {
    return ids;
  }
  const rows = await prisma.employeeDepartment.findMany({
    where: { departmentId: { in: access.departmentIds } },
    select: { employeeId: true },
    distinct: ['employeeId'],
  });
  for (const row of rows) ids.add(row.employeeId);
  return ids;
}

function assertScopedEmployeeMatch(
  scopedEmployeeIds: Set<string>,
  employeeIds: ReadonlyArray<string | null | undefined>,
) {
  if (employeeIds.some((id) => Boolean(id) && scopedEmployeeIds.has(id!))) {
    return;
  }
  throw new NotFoundException('Drive context not found.');
}

function projectDeliveryGraphWhere(scopedEmployeeIds: string[]) {
  return {
    OR: [
      {
        products: {
          some: {
            OR: [
              { pmId: { in: scopedEmployeeIds } },
              { developerId: { in: scopedEmployeeIds } },
              { designerId: { in: scopedEmployeeIds } },
              { technicalSpecialistId: { in: scopedEmployeeIds } },
              { qaLeadId: { in: scopedEmployeeIds } },
            ],
          },
        },
      },
      { extensions: { some: { assignedTo: { in: scopedEmployeeIds } } } },
      {
        orders: {
          some: {
            deal: {
              OR: [
                { sellerId: { in: scopedEmployeeIds } },
                { sellerAssistantId: { in: scopedEmployeeIds } },
                { pmId: { in: scopedEmployeeIds } },
              ],
            },
          },
        },
      },
    ],
  };
}

function productDeliveryGraphWhere(scopedEmployeeIds: string[]) {
  return {
    OR: [
      { pmId: { in: scopedEmployeeIds } },
      { developerId: { in: scopedEmployeeIds } },
      { designerId: { in: scopedEmployeeIds } },
      { technicalSpecialistId: { in: scopedEmployeeIds } },
      { qaLeadId: { in: scopedEmployeeIds } },
    ],
  };
}

function dealDeliveryGraphWhere(scopedEmployeeIds: string[]) {
  return {
    OR: [
      { sellerId: { in: scopedEmployeeIds } },
      { sellerAssistantId: { in: scopedEmployeeIds } },
      { pmId: { in: scopedEmployeeIds } },
    ],
  };
}

async function assertDocumentReadable(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const documentsAccess = access.documentsAccess;
  if (!documentsAccess) {
    throw new NotFoundException('Drive context not found.');
  }
  const resolved = await resolveDocumentsReadContext(prisma, documentsAccess);
  if (resolved.denied) {
    throw new NotFoundException('Drive context not found.');
  }
  const row = await prisma.document.findUnique({
    where: { id: entityId },
    select: {
      ownerId: true,
      createdById: true,
      listScopeOverride: true,
      section: { select: { defaultListScope: true } },
    },
  });
  if (!row) throw new NotFoundException('Drive context not found.');
  if (
    !employeeCanReadDocumentRow(
      row,
      normalizeDocumentsViewScope(documentsAccess.documentsViewScope),
      documentsAccess.employeeId,
      resolved.colleagueIds,
    )
  ) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertEntityExistsByType(
  prisma: InstanceType<typeof PrismaClient>,
  entityType: string,
  entityId: string,
) {
  const loaders: Record<string, () => Promise<unknown>> = {
    CHECKLIST_TEMPLATE: () => prisma.checklistTemplate.findUnique({ where: { id: entityId } }),
    CLIENT_SERVICE_RECORD: () => prisma.clientServiceRecord.findUnique({ where: { id: entityId } }),
    COMPANY: () => prisma.company.findUnique({ where: { id: entityId } }),
    CONTACT: () => prisma.contact.findUnique({ where: { id: entityId } }),
    DOCUMENT: () => prisma.document.findUnique({ where: { id: entityId } }),
    EXPENSE: () => prisma.expense.findUnique({ where: { id: entityId } }),
    INVOICE: () => prisma.invoice.findUnique({ where: { id: entityId } }),
    LEAD: () => prisma.lead.findUnique({ where: { id: entityId } }),
    PARTNER: () => prisma.partner.findUnique({ where: { id: entityId } }),
    PAYMENT: () => prisma.payment.findUnique({ where: { id: entityId } }),
    PRODUCT: () => prisma.product.findUnique({ where: { id: entityId } }),
    PROJECT: () => prisma.project.findUnique({ where: { id: entityId } }),
    SUPPORT_TICKET: () => prisma.supportTicket.findUnique({ where: { id: entityId } }),
    TASK: () => prisma.task.findUnique({ where: { id: entityId } }),
    WORK_SPACE: () => prisma.workSpace.findUnique({ where: { id: entityId } }),
    WORKSPACE: () => prisma.workSpace.findUnique({ where: { id: entityId } }),
    DEAL: () => prisma.deal.findUnique({ where: { id: entityId } }),
    EXTENSION: () => prisma.extension.findUnique({ where: { id: entityId } }),
  };
  const loader = loaders[entityType];
  if (!loader) return;
  const row = await loader();
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertEntityScopedByEmployees(
  prisma: InstanceType<typeof PrismaClient>,
  entityType: string,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const scope = normalizeDriveScope(access.driveScope);
  await assertEntityExistsByType(prisma, entityType, entityId);
  if (scope === SCOPE_ALL) return;

  const scopedEmployeeIds = await loadScopedEmployeeIds(prisma, access);

  switch (entityType) {
    case 'TASK': {
      const row = await prisma.task.findUnique({
        where: { id: entityId },
        select: {
          creatorId: true,
          assigneeId: true,
          coAssignees: true,
          observers: true,
        },
      });
      if (!row) throw new NotFoundException('Drive context not found.');
      assertScopedEmployeeMatch(scopedEmployeeIds, [
        row.creatorId,
        row.assigneeId,
        ...row.coAssignees,
        ...row.observers,
      ]);
      return;
    }
    case 'LEAD': {
      const row = await prisma.lead.findUnique({
        where: { id: entityId },
        select: { assignedTo: true },
      });
      if (!row) throw new NotFoundException('Drive context not found.');
      assertScopedEmployeeMatch(scopedEmployeeIds, [row.assignedTo]);
      return;
    }
    case 'DEAL': {
      const row = await prisma.deal.findUnique({
        where: { id: entityId },
        select: { sellerId: true, sellerAssistantId: true, pmId: true },
      });
      if (!row) throw new NotFoundException('Drive context not found.');
      assertScopedEmployeeMatch(scopedEmployeeIds, [row.sellerId, row.sellerAssistantId, row.pmId]);
      return;
    }
    case 'PRODUCT': {
      const row = await prisma.product.findUnique({
        where: { id: entityId },
        select: {
          pmId: true,
          developerId: true,
          designerId: true,
          technicalSpecialistId: true,
          qaLeadId: true,
        },
      });
      if (!row) throw new NotFoundException('Drive context not found.');
      assertScopedEmployeeMatch(scopedEmployeeIds, [
        row.pmId,
        row.developerId,
        row.designerId,
        row.technicalSpecialistId,
        row.qaLeadId,
      ]);
      return;
    }
    case 'EXTENSION': {
      const row = await prisma.extension.findUnique({
        where: { id: entityId },
        select: { assignedTo: true, closedById: true },
      });
      if (!row) throw new NotFoundException('Drive context not found.');
      assertScopedEmployeeMatch(scopedEmployeeIds, [row.assignedTo, row.closedById]);
      return;
    }
    case 'SUPPORT_TICKET': {
      const row = await prisma.supportTicket.findUnique({
        where: { id: entityId },
        select: { assignedTo: true },
      });
      if (!row) throw new NotFoundException('Drive context not found.');
      assertScopedEmployeeMatch(scopedEmployeeIds, [row.assignedTo]);
      return;
    }
    default:
      return;
  }
}

async function assertProjectScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const scope = normalizeDriveScope(access.driveScope);
  await assertEntityExistsByType(prisma, 'PROJECT', entityId);
  if (scope === SCOPE_ALL) return;

  const scopedEmployeeIds = [...(await loadScopedEmployeeIds(prisma, access))];
  const row = await prisma.project.findFirst({
    where: {
      id: entityId,
      ...projectDeliveryGraphWhere(scopedEmployeeIds),
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertWorkspaceScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const scope = normalizeDriveScope(access.driveScope);
  await assertEntityExistsByType(prisma, 'WORKSPACE', entityId);
  if (scope === SCOPE_ALL) return;

  const scopedEmployeeIds = [...(await loadScopedEmployeeIds(prisma, access))];
  const row = await prisma.workSpace.findFirst({
    where: {
      id: entityId,
      OR: [
        {
          product: productDeliveryGraphWhere(scopedEmployeeIds),
        },
        {
          extension: {
            OR: [
              { assignedTo: { in: scopedEmployeeIds } },
              { closedById: { in: scopedEmployeeIds } },
            ],
          },
        },
        {
          project: projectDeliveryGraphWhere(scopedEmployeeIds),
        },
      ],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertInvoiceScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: entityId },
    select: { projectId: true },
  });
  if (!invoice?.projectId) {
    throw new NotFoundException('Drive context not found.');
  }
  await assertProjectScopedAccessible(prisma, invoice.projectId, access);
}

async function assertPaymentScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: entityId },
    select: {
      invoice: {
        select: { projectId: true },
      },
    },
  });
  const projectId = payment?.invoice?.projectId;
  if (!projectId) {
    throw new NotFoundException('Drive context not found.');
  }
  await assertProjectScopedAccessible(prisma, projectId, access);
}

async function assertClientServiceRecordScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const record = await prisma.clientServiceRecord.findUnique({
    where: { id: entityId },
    select: { projectId: true },
  });
  if (!record?.projectId) {
    throw new NotFoundException('Drive context not found.');
  }
  await assertProjectScopedAccessible(prisma, record.projectId, access);
}

async function assertCompanyScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const scope = normalizeDriveScope(access.driveScope);
  await assertEntityExistsByType(prisma, 'COMPANY', entityId);
  if (scope === SCOPE_ALL) return;

  const scopedEmployeeIds = [...(await loadScopedEmployeeIds(prisma, access))];
  const row = await prisma.company.findFirst({
    where: {
      id: entityId,
      OR: [
        { projects: { some: projectDeliveryGraphWhere(scopedEmployeeIds) } },
        { deals: { some: dealDeliveryGraphWhere(scopedEmployeeIds) } },
      ],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertContactScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const scope = normalizeDriveScope(access.driveScope);
  await assertEntityExistsByType(prisma, 'CONTACT', entityId);
  if (scope === SCOPE_ALL) return;

  const scopedEmployeeIds = [...(await loadScopedEmployeeIds(prisma, access))];
  const row = await prisma.contact.findFirst({
    where: {
      id: entityId,
      OR: [
        { projects: { some: projectDeliveryGraphWhere(scopedEmployeeIds) } },
        { deals: { some: dealDeliveryGraphWhere(scopedEmployeeIds) } },
        { leads: { some: { assignedTo: { in: scopedEmployeeIds } } } },
        { tickets: { some: { assignedTo: { in: scopedEmployeeIds } } } },
      ],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertPartnerScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const scope = normalizeDriveScope(access.driveScope);
  await assertEntityExistsByType(prisma, 'PARTNER', entityId);
  if (scope === SCOPE_ALL) return;

  const scopedEmployeeIds = [...(await loadScopedEmployeeIds(prisma, access))];
  const row = await prisma.partner.findFirst({
    where: {
      id: entityId,
      OR: [
        { dealsAsSource: { some: dealDeliveryGraphWhere(scopedEmployeeIds) } },
        { orders: { some: { project: projectDeliveryGraphWhere(scopedEmployeeIds) } } },
        { subscriptions: { some: { project: projectDeliveryGraphWhere(scopedEmployeeIds) } } },
        { partnerAccruals: { some: { project: projectDeliveryGraphWhere(scopedEmployeeIds) } } },
      ],
    },
    select: { id: true },
  });
  if (!row) {
    throw new NotFoundException('Drive context not found.');
  }
}

async function assertExpenseScopedAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityId: string,
  access: DriveEntityContextAccess,
) {
  const expense = await prisma.expense.findUnique({
    where: { id: entityId },
    select: {
      projectId: true,
      expensePlan: {
        select: { projectId: true },
      },
    },
  });
  const projectId = expense?.projectId ?? expense?.expensePlan?.projectId ?? null;
  if (!projectId) {
    throw new NotFoundException('Drive context not found.');
  }
  await assertProjectScopedAccessible(prisma, projectId, access);
}

/**
 * Phase-1 hardening helper:
 * - uses existing explicit read rules where they exist (`DOCUMENT`);
 * - applies actor/department checks for entities with clear employee ownership fields;
 * - falls back to existence checks for opaque business entities until a full entity-access resolver lands.
 */
export async function assertDriveEntityContextAccessible(
  prisma: InstanceType<typeof PrismaClient>,
  entityTypeInput: string | undefined,
  entityIdInput: string | undefined,
  access: DriveEntityContextAccess,
) {
  const entityType = requireText(entityTypeInput, 'entityType').toUpperCase();
  const entityId = requireText(entityIdInput, 'entityId');

  if (entityType === 'DOCUMENT') {
    await assertDocumentReadable(prisma, entityId, access);
    return;
  }

  if (
    entityType === 'TASK' ||
    entityType === 'LEAD' ||
    entityType === 'DEAL' ||
    entityType === 'PRODUCT' ||
    entityType === 'EXTENSION' ||
    entityType === 'SUPPORT_TICKET'
  ) {
    await assertEntityScopedByEmployees(prisma, entityType, entityId, access);
    return;
  }

  if (entityType === 'PROJECT') {
    await assertProjectScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'WORK_SPACE' || entityType === 'WORKSPACE') {
    await assertWorkspaceScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'INVOICE') {
    await assertInvoiceScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'PAYMENT') {
    await assertPaymentScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'EXPENSE') {
    await assertExpenseScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'CLIENT_SERVICE_RECORD') {
    await assertClientServiceRecordScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'COMPANY') {
    await assertCompanyScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'CONTACT') {
    await assertContactScopedAccessible(prisma, entityId, access);
    return;
  }

  if (entityType === 'PARTNER') {
    await assertPartnerScopedAccessible(prisma, entityId, access);
    return;
  }

  await assertEntityExistsByType(prisma, entityType, entityId);
}
