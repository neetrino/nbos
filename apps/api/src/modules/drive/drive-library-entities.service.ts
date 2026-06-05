import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { buildExpenseParticipationWhere } from '../finance/finance-module-participation.where';
import { buildInvoiceProjectParticipationWhere } from '../finance/invoices/finance-invoice-participation.where';
import {
  buildDealParticipationWhere,
  buildProductParticipationWhere,
  buildProjectParticipationWhere,
} from '../platform-access/platform-team-graph.where';
import { buildTasksParticipationWhere } from '../tasks/task-involves-employee-where.op';
import { buildWorkSpaceParticipationWhere } from '../tasks/task-workspace-access.op';
import type { DriveEntityContextAccess } from './drive-access.types';
import {
  DRIVE_LIBRARY_ENTITY_KEYS,
  type DriveLibraryEntityKey,
  type DriveLibraryEntityRowDto,
} from './drive-library-entities.types';
import {
  driveScopeBypassesParticipation,
  loadDriveScopedEmployeeIds,
} from './drive-scoped-employee-ids';

const LIBRARY_LIST_TAKE = 60;

@Injectable()
export class DriveLibraryEntitiesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async listForLibrary(
    libraryKey: string,
    access: DriveEntityContextAccess,
  ): Promise<{ items: DriveLibraryEntityRowDto[] }> {
    const key = libraryKey.trim().toLowerCase();
    if (!DRIVE_LIBRARY_ENTITY_KEYS.includes(key as DriveLibraryEntityKey)) {
      throw new BadRequestException(
        `library must be one of: ${DRIVE_LIBRARY_ENTITY_KEYS.join(', ')}`,
      );
    }
    const scopedIds = await loadDriveScopedEmployeeIds(this.prisma, access);
    const bypass = driveScopeBypassesParticipation(access.driveScope);
    const items = await this.loadLibrary(key as DriveLibraryEntityKey, scopedIds, bypass);
    return { items: items.sort((a, b) => a.label.localeCompare(b.label)) };
  }

  private async loadLibrary(
    libraryKey: DriveLibraryEntityKey,
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    switch (libraryKey) {
      case 'deals':
        return this.loadDealsLibrary(scopedIds, bypass);
      case 'projects':
        return this.loadProjectsLibrary(scopedIds, bypass);
      case 'products':
        return this.loadProductsLibrary(scopedIds, bypass);
      case 'clients':
        return this.loadClientsLibrary(scopedIds, bypass);
      case 'finance':
        return this.loadFinanceLibrary(scopedIds, bypass);
      case 'partners':
        return this.loadPartnersLibrary(scopedIds, bypass);
      case 'tasks':
        return this.loadTasksLibrary(scopedIds, bypass);
      case 'support':
        return this.loadSupportLibrary(scopedIds, bypass);
      default:
        return [];
    }
  }

  private async loadDealsLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const dealWhere: Prisma.DealWhereInput = bypass ? {} : buildDealParticipationWhere(scopedIds);
    const leadWhere: Prisma.LeadWhereInput = bypass ? {} : { assignedTo: { in: scopedIds } };
    const [deals, leads] = await Promise.all([
      this.prisma.deal.findMany({
        where: dealWhere,
        select: { id: true, code: true, name: true },
        orderBy: { name: 'asc' },
        take: LIBRARY_LIST_TAKE,
      }),
      this.prisma.lead.findMany({
        where: leadWhere,
        select: { id: true, code: true, name: true, contactName: true },
        orderBy: { createdAt: 'desc' },
        take: LIBRARY_LIST_TAKE,
      }),
    ]);
    const dealRows = deals.map((d) => row('DEAL', d.id, d.name?.trim() || 'Deal', d.code));
    const leadRows = leads.map((l) => row('LEAD', l.id, l.contactName || l.name || 'Lead', l.code));
    return [...dealRows, ...leadRows];
  }

  private async loadProjectsLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const where: Prisma.ProjectWhereInput = bypass ? {} : buildProjectParticipationWhere(scopedIds);
    const projects = await this.prisma.project.findMany({
      where,
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
      take: LIBRARY_LIST_TAKE,
    });
    return projects.map((p) => row('PROJECT', p.id, p.name, p.code));
  }

  private async loadProductsLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const where: Prisma.ProductWhereInput = bypass ? {} : buildProductParticipationWhere(scopedIds);
    const products = await this.prisma.product.findMany({
      where,
      select: { id: true, name: true, project: { select: { code: true } } },
      orderBy: { name: 'asc' },
      take: LIBRARY_LIST_TAKE,
    });
    return products.map((p) => row('PRODUCT', p.id, p.name, p.project?.code ?? undefined));
  }

  private async loadClientsLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const projectFilter = buildProjectParticipationWhere(scopedIds);
    const dealFilter = buildDealParticipationWhere(scopedIds);
    const companyWhere: Prisma.CompanyWhereInput = bypass
      ? {}
      : {
          OR: [{ projects: { some: projectFilter } }, { deals: { some: dealFilter } }],
        };
    const contactWhere: Prisma.ContactWhereInput = bypass
      ? {}
      : {
          OR: [
            { projects: { some: projectFilter } },
            { deals: { some: dealFilter } },
            { leads: { some: { assignedTo: { in: scopedIds } } } },
            { tickets: { some: { assignedTo: { in: scopedIds } } } },
          ],
        };
    const [companies, contacts] = await Promise.all([
      this.prisma.company.findMany({
        where: companyWhere,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: LIBRARY_LIST_TAKE,
      }),
      this.prisma.contact.findMany({
        where: contactWhere,
        select: { id: true, firstName: true, lastName: true },
        orderBy: { lastName: 'asc' },
        take: LIBRARY_LIST_TAKE,
      }),
    ]);
    const companyRows = companies.map((c) => ({
      id: c.id,
      entityType: 'COMPANY',
      label: `Company: ${c.name}`,
    }));
    const contactRows = contacts.map((c) => ({
      id: c.id,
      entityType: 'CONTACT',
      label: `Contact: ${c.firstName} ${c.lastName}`,
    }));
    return [...companyRows, ...contactRows];
  }

  private async loadFinanceLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const invoiceWhere: Prisma.InvoiceWhereInput = bypass
      ? {}
      : buildInvoiceProjectParticipationWhere(scopedIds);
    const expenseWhere: Prisma.ExpenseWhereInput = bypass
      ? {}
      : buildExpenseParticipationWhere(scopedIds, false);
    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({
        where: invoiceWhere,
        select: { id: true, code: true },
        orderBy: { createdAt: 'desc' },
        take: LIBRARY_LIST_TAKE,
      }),
      this.prisma.expense.findMany({
        where: expenseWhere,
        select: { id: true, name: true },
        orderBy: { createdAt: 'desc' },
        take: LIBRARY_LIST_TAKE,
      }),
    ]);
    const invRows = invoices.map((i) => ({
      id: i.id,
      entityType: 'INVOICE',
      label: `Invoice ${i.code}`,
    }));
    const expRows = expenses.map((e) => ({
      id: e.id,
      entityType: 'EXPENSE',
      label: `Expense: ${e.name}`,
    }));
    return [...invRows, ...expRows];
  }

  private async loadPartnersLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const projectFilter = buildProjectParticipationWhere(scopedIds);
    const dealFilter = buildDealParticipationWhere(scopedIds);
    const where: Prisma.PartnerWhereInput = bypass
      ? {}
      : {
          OR: [
            { dealsAsSource: { some: dealFilter } },
            { orders: { some: { project: projectFilter } } },
            { subscriptions: { some: { project: projectFilter } } },
            { partnerAccruals: { some: { project: projectFilter } } },
          ],
        };
    const partners = await this.prisma.partner.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: LIBRARY_LIST_TAKE,
    });
    return partners.map((p) => ({ id: p.id, entityType: 'PARTNER', label: p.name }));
  }

  private async loadTasksLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const taskWhere: Prisma.TaskWhereInput = bypass ? {} : buildTasksParticipationWhere(scopedIds);
    const wsWhere: Prisma.WorkSpaceWhereInput = bypass
      ? {}
      : buildWorkSpaceParticipationWhere(scopedIds);
    const [tasks, workspaces] = await Promise.all([
      this.prisma.task.findMany({
        where: taskWhere,
        select: { id: true, code: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: LIBRARY_LIST_TAKE,
      }),
      this.prisma.workSpace.findMany({
        where: wsWhere,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
        take: LIBRARY_LIST_TAKE,
      }),
    ]);
    const taskRows = tasks.map((t) => row('TASK', t.id, t.title, t.code));
    const wsRows = workspaces.map((w) => row('WORK_SPACE', w.id, w.name));
    return [...taskRows, ...wsRows];
  }

  private async loadSupportLibrary(
    scopedIds: string[],
    bypass: boolean,
  ): Promise<DriveLibraryEntityRowDto[]> {
    const where: Prisma.SupportTicketWhereInput = bypass ? {} : { assignedTo: { in: scopedIds } };
    const tickets = await this.prisma.supportTicket.findMany({
      where,
      select: { id: true, code: true, title: true },
      orderBy: { createdAt: 'desc' },
      take: LIBRARY_LIST_TAKE,
    });
    return tickets.map((t) => row('SUPPORT_TICKET', t.id, t.title, t.code));
  }
}

function row(
  entityType: string,
  id: string,
  name: string,
  code?: string | null,
): DriveLibraryEntityRowDto {
  const label = name.trim() || 'Untitled';
  const trimmedCode = code?.trim();
  return {
    id,
    entityType,
    label,
    ...(trimmedCode ? { code: trimmedCode } : {}),
  };
}
