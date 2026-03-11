import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type PartnerTypeEnum,
  type PartnerDirectionEnum,
  type PartnerStatusEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface PartnerQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
}

interface CreatePartnerDto {
  name: string;
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string;
}

interface UpdatePartnerDto {
  name?: string;
  type?: string;
  direction?: string;
  defaultPercent?: number;
  status?: string;
  contactId?: string;
}

const PARTNER_INCLUDE = {
  _count: { select: { subscriptions: true, orders: true } },
} satisfies Prisma.PartnerInclude;

@Injectable()
export class PartnersService {
  constructor(
    @Inject(PRISMA_TOKEN)
    private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  async findAll(params: PartnerQueryParams) {
    const { page = 1, pageSize = 20, search, status, type } = params;
    const where: Prisma.PartnerWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status) where.status = status as PartnerStatusEnum;
    if (type) where.type = type as PartnerTypeEnum;

    const [items, total] = await Promise.all([
      this.prisma.partner.findMany({
        where,
        include: PARTNER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.partner.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: PARTNER_INCLUDE,
    });
    if (!partner) throw new NotFoundException(`Partner ${id} not found`);
    return partner;
  }

  async create(data: CreatePartnerDto) {
    return this.prisma.partner.create({
      data: {
        name: data.name,
        type: (data.type as PartnerTypeEnum) ?? 'REGULAR',
        direction: (data.direction as PartnerDirectionEnum) ?? 'INBOUND',
        defaultPercent: data.defaultPercent ?? 30,
        status: (data.status as PartnerStatusEnum) ?? 'ACTIVE',
        contactId: data.contactId,
      },
      include: PARTNER_INCLUDE,
    });
  }

  async update(id: string, data: UpdatePartnerDto) {
    await this.findById(id);

    return this.prisma.partner.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type && { type: data.type as PartnerTypeEnum }),
        ...(data.direction && { direction: data.direction as PartnerDirectionEnum }),
        ...(data.defaultPercent !== undefined && { defaultPercent: data.defaultPercent }),
        ...(data.status && { status: data.status as PartnerStatusEnum }),
        ...(data.contactId !== undefined && { contactId: data.contactId || null }),
      },
      include: PARTNER_INCLUDE,
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.partner.delete({ where: { id } });
  }

  async getStats() {
    const [total, totalSubscriptions, avgPayout] = await Promise.all([
      this.prisma.partner.count(),
      this.prisma.subscription.count({
        where: { partnerId: { not: null } },
      }),
      this.prisma.partner.aggregate({
        _avg: { defaultPercent: true },
      }),
    ]);

    return {
      total,
      totalSubscriptions,
      avgPayoutPercent: Number(avgPayout._avg?.defaultPercent ?? 0),
    };
  }
}
