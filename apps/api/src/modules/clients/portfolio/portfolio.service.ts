import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma, Decimal } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import type { CurrentUserPayload } from '../../../common/decorators';
import { buildPortfolioAccessMask } from './portfolio-access-mask';
import {
  applyMaskToCompanyPortfolio,
  applyMaskToContactPortfolio,
} from './portfolio-payload-policy';

function decimalToString(value: Decimal | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.toString();
}

@Injectable()
export class PortfolioService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async getContactPortfolio(contactId: string, user: CurrentUserPayload) {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            type: true,
            taxStatus: true,
            _count: { select: { projects: true } },
          },
        },
        projects: {
          where: { isArchived: false },
          orderBy: { createdAt: 'desc' },
          take: 80,
          select: {
            id: true,
            code: true,
            name: true,
            company: { select: { id: true, name: true } },
            _count: { select: { products: true, extensions: true } },
          },
        },
        leads: {
          take: 30,
          orderBy: { createdAt: 'desc' },
          select: { id: true, code: true, status: true, createdAt: true },
        },
        deals: {
          take: 30,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            status: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    });
    if (!contact) throw new NotFoundException(`Contact ${contactId} not found`);

    const projectIds = contact.projects.map((p) => p.id);
    const invoiceWhere: Prisma.InvoiceWhereInput | null =
      projectIds.length > 0 ? { projectId: { in: projectIds } } : null;

    const [subscriptions, invoices, tickets, clientServices, overdueInvoices] = await Promise.all([
      projectIds.length > 0
        ? this.prisma.subscription.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
              id: true,
              code: true,
              status: true,
              amount: true,
              projectId: true,
              project: { select: { code: true, name: true } },
            },
          })
        : [],
      invoiceWhere
        ? this.prisma.invoice.findMany({
            where: invoiceWhere,
            orderBy: { createdAt: 'desc' },
            take: 60,
            select: {
              id: true,
              code: true,
              moneyStatus: true,
              amount: true,
              projectId: true,
              companyId: true,
            },
          })
        : [],
      this.prisma.supportTicket.findMany({
        where: {
          OR: [
            { contactId },
            ...(projectIds.length > 0 ? [{ projectId: { in: projectIds } }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: {
          id: true,
          code: true,
          status: true,
          title: true,
          projectId: true,
          project: { select: { code: true, name: true } },
        },
      }),
      projectIds.length > 0
        ? this.prisma.clientServiceRecord.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            take: 40,
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              projectId: true,
              project: { select: { code: true, name: true } },
            },
          })
        : [],
      invoiceWhere
        ? this.prisma.invoice.count({
            where: {
              ...invoiceWhere,
              moneyStatus: { in: ['OVERDUE', 'AWAITING_PAYMENT'] },
            },
          })
        : 0,
    ]);

    const paidInvoices = invoices.filter((i) => i.moneyStatus === 'PAID');
    const outstandingInvoices = invoices.filter((i) =>
      ['NEW', 'AWAITING_PAYMENT', 'OVERDUE', 'ON_HOLD'].includes(i.moneyStatus),
    );

    const accessMask = buildPortfolioAccessMask(user.permissions ?? {});
    const base = {
      scope: 'contact' as const,
      accessMask,
      clientHealth: 'good' as const,
      contact,
      subscriptions: subscriptions.map((s) => ({
        ...s,
        amount: decimalToString(s.amount),
      })),
      invoices: invoices.map((inv) => ({
        ...inv,
        amount: decimalToString(inv.amount),
      })),
      tickets,
      clientServices,
      summary: {
        projectCount: contact.projects.length,
        companyCount: contact.companies.length,
        openTicketCount: tickets.filter((t) => t.status !== 'CLOSED').length,
        paidInvoiceCount: paidInvoices.length,
        outstandingInvoiceCount: outstandingInvoices.length,
        overdueInvoiceCount: overdueInvoices,
        subscriptionActiveCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
      },
    };
    return applyMaskToContactPortfolio(base, { overdueInvoices });
  }

  async getCompanyPortfolio(companyId: string, user: CurrentUserPayload) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        contact: true,
        billingContact: true,
        projects: {
          where: { isArchived: false },
          orderBy: { createdAt: 'desc' },
          take: 80,
          select: {
            id: true,
            code: true,
            name: true,
            contact: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { products: true, extensions: true } },
          },
        },
      },
    });
    if (!company) throw new NotFoundException(`Company ${companyId} not found`);

    const projectIds = company.projects.map((p) => p.id);

    const [invoices, subscriptions, tickets, clientServices, overdueInvoices] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 80,
        select: {
          id: true,
          code: true,
          moneyStatus: true,
          amount: true,
          projectId: true,
        },
      }),
      projectIds.length > 0
        ? this.prisma.subscription.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
              id: true,
              code: true,
              status: true,
              amount: true,
              projectId: true,
              project: { select: { code: true, name: true } },
            },
          })
        : [],
      projectIds.length > 0
        ? this.prisma.supportTicket.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            take: 40,
            select: {
              id: true,
              code: true,
              status: true,
              title: true,
              projectId: true,
              project: { select: { code: true, name: true } },
            },
          })
        : [],
      projectIds.length > 0
        ? this.prisma.clientServiceRecord.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            take: 40,
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              projectId: true,
              project: { select: { code: true, name: true } },
            },
          })
        : [],
      this.prisma.invoice.count({
        where: {
          companyId,
          moneyStatus: { in: ['OVERDUE', 'AWAITING_PAYMENT'] },
        },
      }),
    ]);

    const paidInvoices = invoices.filter((i) => i.moneyStatus === 'PAID');
    const outstandingInvoices = invoices.filter((i) =>
      ['NEW', 'AWAITING_PAYMENT', 'OVERDUE', 'ON_HOLD'].includes(i.moneyStatus),
    );

    const accessMask = buildPortfolioAccessMask(user.permissions ?? {});
    const base = {
      scope: 'company' as const,
      accessMask,
      clientHealth: 'good' as const,
      company,
      subscriptions: subscriptions.map((s) => ({
        ...s,
        amount: decimalToString(s.amount),
      })),
      invoices: invoices.map((inv) => ({
        ...inv,
        amount: decimalToString(inv.amount),
      })),
      tickets,
      clientServices,
      summary: {
        projectCount: company.projects.length,
        openTicketCount: tickets.filter((t) => t.status !== 'CLOSED').length,
        overdueInvoiceCount: overdueInvoices,
        subscriptionActiveCount: subscriptions.filter((s) => s.status === 'ACTIVE').length,
        paidInvoiceCount: paidInvoices.length,
        outstandingInvoiceCount: outstandingInvoices.length,
      },
    };
    return applyMaskToCompanyPortfolio(base, { overdueInvoices });
  }
}
