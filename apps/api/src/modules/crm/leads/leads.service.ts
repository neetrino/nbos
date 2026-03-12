import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';

interface CreateLeadDto {
  name?: string;
  contactName: string;
  phone?: string;
  email?: string;
  source: string;
  assignedTo?: string;
  notes?: string;
}

interface UpdateLeadDto {
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
  assignedTo?: string;
  notes?: string;
}

interface LeadQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  source?: string;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class LeadsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: LeadQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      status,
      source,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.LeadWhereInput = {};

    if (status) {
      where.status = status as Prisma.EnumLeadStatusEnumFilter['equals'];
    }
    if (source) {
      where.source = source as Prisma.EnumLeadSourceEnumFilter['equals'];
    }
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, code: true, status: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lead.count({ where }),
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
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        contact: true,
        deal: true,
      },
    });
    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
    return lead;
  }

  async create(data: CreateLeadDto) {
    const code = await this.generateCode();
    return this.prisma.lead.create({
      data: {
        code,
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        source: data.source as Prisma.LeadCreateInput['source'],
        assignedTo: data.assignedTo,
        notes: data.notes,
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateLeadDto) {
    await this.findById(id);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.contactName && { contactName: data.contactName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.source && { source: data.source as Prisma.LeadUpdateInput['source'] }),
        ...(data.status && { status: data.status as Prisma.LeadUpdateInput['status'] }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, code: true, status: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    return this.update(id, { status });
  }

  async getStats() {
    const [total, byStatus, bySource] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.lead.groupBy({
        by: ['source'],
        _count: true,
      }),
    ]);

    return { total, byStatus, bySource };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastLead = await this.prisma.lead.findFirst({
      where: { code: { startsWith: `L-${year}-` } },
      orderBy: { code: 'desc' },
    });

    const nextNum = lastLead ? parseInt(lastLead.code.split('-')[2] ?? '0', 10) + 1 : 1;

    return `L-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
