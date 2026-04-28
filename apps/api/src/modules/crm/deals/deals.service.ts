import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AuditService } from '../../audit/audit.service';
import { DealWonHandler } from './deal-won.handler';
import { validateDealStageGate } from './deal-stage-gate';
import { type DealWonOverrideContext, validateDealWonGate } from './deal-won-gate';

interface CreateDealDto {
  name?: string;
  leadId?: string;
  contactId: string;
  type: string;
  amount?: number;
  paymentType?: string;
  taxStatus?: string;
  companyId?: string | null;
  sellerId: string;
  projectId?: string;
  source?: string;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  marketingAccountId?: string | null;
  marketingActivityId?: string | null;
  notes?: string;
  productCategory?: string | null;
  productType?: string | null;
  pmId?: string | null;
  deadline?: string | null;
  existingProductId?: string | null;
  offerSentAt?: string | null;
  offerLink?: string | null;
  offerFileUrl?: string | null;
  offerScreenshotUrl?: string | null;
  responseDueAt?: string | null;
  contractSignedAt?: string | null;
  contractFileUrl?: string | null;
}

interface UpdateDealDto {
  name?: string;
  status?: string;
  type?: string;
  amount?: number;
  paymentType?: string;
  taxStatus?: string;
  companyId?: string | null;
  contactId?: string;
  projectId?: string | null;
  source?: string;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  marketingAccountId?: string | null;
  marketingActivityId?: string | null;
  notes?: string;
  productCategory?: string | null;
  productType?: string | null;
  pmId?: string | null;
  deadline?: string | null;
  existingProductId?: string | null;
  offerSentAt?: string | null;
  offerLink?: string | null;
  offerFileUrl?: string | null;
  offerScreenshotUrl?: string | null;
  responseDueAt?: string | null;
  contractSignedAt?: string | null;
  contractFileUrl?: string | null;
}

interface DealQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
  sellerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class DealsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly dealWonHandler: DealWonHandler,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: DealQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      type,
      sellerId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.DealWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumDealStatusEnumFilter['equals'];
    }
    if (type) {
      where.type = type as Prisma.EnumDealTypeEnumFilter['equals'];
    }
    if (sellerId) {
      where.sellerId = sellerId;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: {
          lead: { select: { id: true, code: true, contactName: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          pm: { select: { id: true, firstName: true, lastName: true } },
          orders: {
            select: {
              id: true,
              code: true,
              status: true,
              totalAmount: true,
              projectId: true,
              invoices: {
                select: {
                  id: true,
                  code: true,
                  status: true,
                  amount: true,
                  payments: { select: { id: true, amount: true } },
                },
              },
            },
          },
          existingProduct: { select: { id: true, name: true, productType: true } },
          sourcePartner: { select: { id: true, name: true } },
          sourceContact: { select: { id: true, firstName: true, lastName: true } },
          marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
          marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        lead: true,
        contact: true,
        company: { select: { id: true, name: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        pm: { select: { id: true, firstName: true, lastName: true } },
        orders: {
          include: {
            invoices: {
              select: {
                id: true,
                code: true,
                status: true,
                amount: true,
                paidDate: true,
                payments: { select: { id: true, amount: true, paymentDate: true } },
              },
            },
          },
        },
        existingProduct: { select: { id: true, name: true, productType: true } },
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
      },
    });
    if (!deal) {
      throw new NotFoundException(`Deal ${id} not found`);
    }
    return deal;
  }

  async create(data: CreateDealDto) {
    const code = await this.generateCode();
    return this.prisma.deal.create({
      data: {
        code,
        name: data.name,
        leadId: data.leadId,
        contactId: data.contactId,
        type: data.type as Prisma.DealCreateInput['type'],
        amount: data.amount,
        paymentType: data.paymentType as Prisma.DealCreateInput['paymentType'],
        taxStatus: (data.taxStatus as Prisma.DealCreateInput['taxStatus']) ?? 'TAX',
        companyId: data.companyId ?? undefined,
        sellerId: data.sellerId,
        source: data.source as Prisma.DealCreateInput['source'],
        sourceDetail: data.sourceDetail,
        sourcePartnerId: data.sourcePartnerId,
        sourceContactId: data.sourceContactId,
        marketingAccountId: data.marketingAccountId,
        marketingActivityId: data.marketingActivityId,
        notes: data.notes,
        productCategory:
          (data.productCategory as Prisma.DealCreateInput['productCategory']) ?? undefined,
        productType: data.productType ?? undefined,
        pmId: data.pmId ?? undefined,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        existingProductId: data.existingProductId ?? undefined,
        offerSentAt: data.offerSentAt ? new Date(data.offerSentAt) : undefined,
        offerLink: data.offerLink,
        offerFileUrl: data.offerFileUrl,
        offerScreenshotUrl: data.offerScreenshotUrl,
        responseDueAt: data.responseDueAt ? new Date(data.responseDueAt) : undefined,
        contractSignedAt: data.contractSignedAt ? new Date(data.contractSignedAt) : undefined,
        contractFileUrl: data.contractFileUrl,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
      },
    });
  }

  async update(id: string, data: UpdateDealDto) {
    await this.findById(id);

    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status && { status: data.status as Prisma.DealUpdateInput['status'] }),
        ...(data.type && { type: data.type as Prisma.DealUpdateInput['type'] }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.paymentType && {
          paymentType: data.paymentType as Prisma.DealUpdateInput['paymentType'],
        }),
        ...(data.taxStatus && { taxStatus: data.taxStatus as Prisma.DealUpdateInput['taxStatus'] }),
        ...(data.companyId !== undefined && { companyId: data.companyId }),
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.source && { source: data.source as Prisma.DealUpdateInput['source'] }),
        ...(data.sourceDetail !== undefined && { sourceDetail: data.sourceDetail }),
        ...(data.sourcePartnerId !== undefined && { sourcePartnerId: data.sourcePartnerId }),
        ...(data.sourceContactId !== undefined && { sourceContactId: data.sourceContactId }),
        ...(data.marketingAccountId !== undefined && {
          marketingAccountId: data.marketingAccountId,
        }),
        ...(data.marketingActivityId !== undefined && {
          marketingActivityId: data.marketingActivityId,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.productCategory !== undefined && {
          productCategory: data.productCategory as Prisma.DealUpdateInput['productCategory'],
        }),
        ...(data.productType !== undefined && { productType: data.productType }),
        ...(data.pmId !== undefined && { pmId: data.pmId }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.existingProductId !== undefined && {
          existingProductId: data.existingProductId,
        }),
        ...(data.offerSentAt !== undefined && {
          offerSentAt: data.offerSentAt ? new Date(data.offerSentAt) : null,
        }),
        ...(data.offerLink !== undefined && { offerLink: data.offerLink }),
        ...(data.offerFileUrl !== undefined && { offerFileUrl: data.offerFileUrl }),
        ...(data.offerScreenshotUrl !== undefined && {
          offerScreenshotUrl: data.offerScreenshotUrl,
        }),
        ...(data.responseDueAt !== undefined && {
          responseDueAt: data.responseDueAt ? new Date(data.responseDueAt) : null,
        }),
        ...(data.contractSignedAt !== undefined && {
          contractSignedAt: data.contractSignedAt ? new Date(data.contractSignedAt) : null,
        }),
        ...(data.contractFileUrl !== undefined && { contractFileUrl: data.contractFileUrl }),
      },
      include: {
        lead: { select: { id: true, code: true, contactName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        pm: { select: { id: true, firstName: true, lastName: true } },
        orders: {
          select: {
            id: true,
            code: true,
            status: true,
            totalAmount: true,
            projectId: true,
            invoices: {
              select: {
                id: true,
                code: true,
                status: true,
                amount: true,
                payments: { select: { id: true, amount: true } },
              },
            },
          },
        },
        existingProduct: { select: { id: true, name: true, productType: true } },
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
        marketingAccount: { select: { id: true, name: true, channel: true, phone: true } },
        marketingActivity: { select: { id: true, title: true, channel: true, status: true } },
      },
    });
  }

  async updateStatus(id: string, status: string, override: DealWonOverrideContext = {}) {
    const current = await this.findById(id);
    if (current.status === status) {
      return current;
    }

    validateDealStageGate(current, status);
    if (status === 'WON') {
      validateDealWonGate(current, override);
    }

    const deal = await this.update(id, {
      status,
      ...(status === 'WON' && override.reason?.trim()
        ? { notes: this.appendOverrideNote(current.notes, override.reason.trim()) }
        : {}),
    });

    if (status === 'WON') {
      if (override.reason?.trim() && override.actorId) {
        await this.auditService.log({
          entityType: 'DEAL',
          entityId: id,
          action: 'DEAL_WON_OVERRIDE',
          userId: override.actorId,
          changes: { reason: override.reason.trim() },
        });
      }
      await this.dealWonHandler.handle(deal);
    }

    return deal;
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.deal.delete({ where: { id } });
  }

  async getStats() {
    const [total, byStatus, byType] = await Promise.all([
      this.prisma.deal.count(),
      this.prisma.deal.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.deal.groupBy({
        by: ['type'],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return { total, byStatus, byType };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastDeal = await this.prisma.deal.findFirst({
      where: { code: { startsWith: `D-${year}-` } },
      orderBy: { code: 'desc' },
    });

    const nextNum = lastDeal ? parseInt(lastDeal.code.split('-')[2] ?? '0', 10) + 1 : 1;

    return `D-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private appendOverrideNote(notes: string | null, reason: string): string {
    const line = `Deal Won override reason: ${reason}`;
    return notes ? `${notes}\n${line}` : line;
  }
}
