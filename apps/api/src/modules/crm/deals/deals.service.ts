import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface CreateDealDto {
  name?: string;
  leadId?: string;
  contactId: string;
  type: string;
  amount?: number;
  paymentType?: string;
  sellerId: string;
  projectId?: string;
  source?: string;
  notes?: string;
}

interface UpdateDealDto {
  name?: string;
  status?: string;
  type?: string;
  amount?: number;
  paymentType?: string;
  contactId?: string;
  projectId?: string | null;
  source?: string;
  sourceDetail?: string | null;
  sourcePartnerId?: string | null;
  sourceContactId?: string | null;
  notes?: string;
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
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

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
          seller: { select: { id: true, firstName: true, lastName: true } },
          orders: {
            select: {
              id: true,
              code: true,
              status: true,
              totalAmount: true,
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
          sourcePartner: { select: { id: true, name: true } },
          sourceContact: { select: { id: true, firstName: true, lastName: true } },
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
        seller: { select: { id: true, firstName: true, lastName: true } },
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
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
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
        sellerId: data.sellerId,
        source: data.source as Prisma.DealCreateInput['source'],
        notes: data.notes,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
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
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.source && { source: data.source as Prisma.DealUpdateInput['source'] }),
        ...(data.sourceDetail !== undefined && { sourceDetail: data.sourceDetail }),
        ...(data.sourcePartnerId !== undefined && { sourcePartnerId: data.sourcePartnerId }),
        ...(data.sourceContactId !== undefined && { sourceContactId: data.sourceContactId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        lead: { select: { id: true, code: true, contactName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
        orders: {
          select: {
            id: true,
            code: true,
            status: true,
            totalAmount: true,
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
        sourcePartner: { select: { id: true, name: true } },
        sourceContact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status });
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
}
