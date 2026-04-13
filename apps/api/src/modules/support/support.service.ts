import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type TicketStatusEnum,
  type TicketPriorityEnum,
  type TicketCategoryEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

const SLA_DEADLINES: Record<string, { responseHours: number; resolveHours: number }> = {
  P1: { responseHours: 4, resolveHours: 24 },
  P2: { responseHours: 8, resolveHours: 48 },
  P3: { responseHours: 24, resolveHours: 72 },
};

interface CreateTicketDto {
  title: string;
  projectId: string;
  category: string;
  description?: string;
  contactId?: string;
  priority?: string;
  billable?: boolean;
  assignedTo?: string;
}

interface UpdateTicketDto {
  title?: string;
  description?: string;
  projectId?: string;
  contactId?: string;
  category?: string;
  priority?: string;
  billable?: boolean;
  assignedTo?: string;
}

interface TicketQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class SupportService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: TicketQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      status,
      priority,
      category,
      assignedTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhere({ projectId, status, priority, category, assignedTo, search });

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true },
        },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    return ticket;
  }

  async create(data: CreateTicketDto) {
    const code = await this.generateCode();
    const priority = (data.priority as TicketPriorityEnum) ?? 'P3';
    const sla = this.calculateSlaDeadlines(priority);

    return this.prisma.supportTicket.create({
      data: {
        code,
        title: data.title,
        projectId: data.projectId,
        category: data.category as TicketCategoryEnum,
        description: data.description,
        contactId: data.contactId,
        priority,
        billable: data.billable ?? false,
        assignedTo: data.assignedTo,
        slaResponseDeadline: sla.responseDeadline,
        slaResolveDeadline: sla.resolveDeadline,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateTicketDto) {
    await this.findById(id);

    const updateData: Prisma.SupportTicketUpdateInput = {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.projectId && { project: { connect: { id: data.projectId } } }),
      ...(data.contactId !== undefined && {
        contact: data.contactId ? { connect: { id: data.contactId } } : { disconnect: true },
      }),
      ...(data.category && { category: data.category as TicketCategoryEnum }),
      ...(data.billable !== undefined && { billable: data.billable }),
      ...(data.assignedTo !== undefined && {
        assignee: data.assignedTo ? { connect: { id: data.assignedTo } } : { disconnect: true },
      }),
    };

    if (data.priority) {
      const sla = this.calculateSlaDeadlines(data.priority as TicketPriorityEnum);
      updateData.priority = data.priority as TicketPriorityEnum;
      updateData.slaResponseDeadline = sla.responseDeadline;
      updateData.slaResolveDeadline = sla.resolveDeadline;
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, code: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: status as TicketStatusEnum },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.supportTicket.delete({ where: { id } });
  }

  async getStats() {
    const [byStatus, byPriority, byCategory] = await Promise.all([
      this.prisma.supportTicket.groupBy({ by: ['status'], _count: true }),
      this.prisma.supportTicket.groupBy({ by: ['priority'], _count: true }),
      this.prisma.supportTicket.groupBy({ by: ['category'], _count: true }),
    ]);
    return { byStatus, byPriority, byCategory };
  }

  private calculateSlaDeadlines(priority: string) {
    const sla = SLA_DEADLINES[priority] ?? SLA_DEADLINES['P3'];
    const now = new Date();
    return {
      responseDeadline: new Date(now.getTime() + sla.responseHours * 3600_000),
      resolveDeadline: new Date(now.getTime() + sla.resolveHours * 3600_000),
    };
  }

  private buildWhere(
    filters: Omit<TicketQueryParams, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>,
  ): Prisma.SupportTicketWhereInput {
    const where: Prisma.SupportTicketWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status as TicketStatusEnum;
    if (filters.priority) where.priority = filters.priority as TicketPriorityEnum;
    if (filters.category) where.category = filters.category as TicketCategoryEnum;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.supportTicket.findFirst({
      where: { code: { startsWith: `TKT-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `TKT-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
