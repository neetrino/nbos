import { BadRequestException, Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type TaskPriorityEnum,
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

const SUPPORT_TICKET_ENTITY_TYPE = 'SUPPORT_TICKET';
const PROJECT_ENTITY_TYPE = 'PROJECT';
const PRODUCT_ENTITY_TYPE = 'PRODUCT';

const TICKET_PRIORITY_TO_TASK_PRIORITY: Record<TicketPriorityEnum, TaskPriorityEnum> = {
  P1: 'CRITICAL',
  P2: 'HIGH',
  P3: 'NORMAL',
};

const SUPPORT_TICKET_INCLUDE = {
  project: { select: { id: true, code: true, name: true } },
  product: { select: { id: true, name: true, status: true } },
  contact: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.SupportTicketInclude;

const SUPPORT_TASK_INCLUDE = {
  creator: { select: { id: true, firstName: true, lastName: true } },
  assignee: { select: { id: true, firstName: true, lastName: true } },
  links: true,
  checklists: { include: { items: { orderBy: { sortOrder: 'asc' as const } } } },
  subtasks: {
    select: { id: true, code: true, title: true, status: true, assigneeId: true },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: { select: { subtasks: true, checklists: true } },
} satisfies Prisma.TaskInclude;

interface CreateTicketDto {
  title: string;
  projectId: string;
  category: string;
  description?: string;
  productId?: string;
  contactId?: string;
  priority?: string;
  billable?: boolean;
  assignedTo?: string;
}

interface UpdateTicketDto {
  title?: string;
  description?: string;
  projectId?: string;
  productId?: string | null;
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
  productId?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateTicketTaskDto {
  creatorId: string;
  title?: string;
  description?: string;
  dueDate?: string | null;
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
        include: SUPPORT_TICKET_INCLUDE,
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
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    const executionTasks = await this.findExecutionTasks(id);
    return { ...ticket, executionTasks };
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
        productId: data.productId,
        category: data.category as TicketCategoryEnum,
        description: data.description,
        contactId: data.contactId,
        priority,
        billable: data.billable ?? false,
        assignedTo: data.assignedTo,
        slaResponseDeadline: sla.responseDeadline,
        slaResolveDeadline: sla.resolveDeadline,
      },
      include: SUPPORT_TICKET_INCLUDE,
    });
  }

  async update(id: string, data: UpdateTicketDto) {
    await this.findById(id);

    const updateData: Prisma.SupportTicketUpdateInput = {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.projectId && { project: { connect: { id: data.projectId } } }),
      ...(data.productId !== undefined && {
        product: data.productId ? { connect: { id: data.productId } } : { disconnect: true },
      }),
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
      include: SUPPORT_TICKET_INCLUDE,
    });
  }

  async createExecutionTask(id: string, data: CreateTicketTaskDto) {
    const ticket = await this.findTicketForTaskBridge(id);
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      throw new BadRequestException('Resolved or closed support tickets cannot create tasks.');
    }

    const workspaceId = await this.findProductWorkspaceId(ticket.productId);
    return this.prisma.task.create({
      data: {
        code: await this.generateTaskCode(),
        title: this.buildExecutionTaskTitle(ticket, data.title),
        creatorId: data.creatorId,
        description: data.description ?? this.buildExecutionTaskDescription(ticket),
        assigneeId: ticket.assignedTo,
        priority: TICKET_PRIORITY_TO_TASK_PRIORITY[ticket.priority],
        dueDate: data.dueDate ? new Date(data.dueDate) : ticket.slaResolveDeadline,
        workspaceId,
        ...(workspaceId && { planningStatus: 'BACKLOG' }),
        links: { createMany: { data: this.buildTaskLinks(ticket) } },
      },
      include: SUPPORT_TASK_INCLUDE,
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
    if (filters.productId) where.productId = filters.productId;
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

  private async generateTaskCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.task.findFirst({
      where: { code: { startsWith: `T-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `T-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async findExecutionTasks(ticketId: string) {
    return this.prisma.task.findMany({
      where: { links: { some: { entityType: SUPPORT_TICKET_ENTITY_TYPE, entityId: ticketId } } },
      include: SUPPORT_TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findTicketForTaskBridge(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: SUPPORT_TICKET_INCLUDE,
    });
    if (!ticket) throw new NotFoundException(`Support ticket ${id} not found`);
    return ticket;
  }

  private async findProductWorkspaceId(productId: string | null) {
    if (!productId) return undefined;
    const workspace = await this.prisma.workSpace.findUnique({
      where: { productId },
      select: { id: true },
    });
    return workspace?.id;
  }

  private buildTaskLinks(ticket: Awaited<ReturnType<SupportService['findTicketForTaskBridge']>>) {
    return [
      { entityType: SUPPORT_TICKET_ENTITY_TYPE, entityId: ticket.id },
      { entityType: PROJECT_ENTITY_TYPE, entityId: ticket.projectId },
      ...(ticket.productId
        ? [{ entityType: PRODUCT_ENTITY_TYPE, entityId: ticket.productId }]
        : []),
    ];
  }

  private buildExecutionTaskTitle(
    ticket: Awaited<ReturnType<SupportService['findTicketForTaskBridge']>>,
    title?: string,
  ) {
    const trimmed = title?.trim();
    return trimmed || `[${ticket.code}] ${ticket.title}`;
  }

  private buildExecutionTaskDescription(
    ticket: Awaited<ReturnType<SupportService['findTicketForTaskBridge']>>,
  ) {
    return `Support ticket: ${ticket.code}\n${ticket.description ?? ''}`.trim();
  }
}
