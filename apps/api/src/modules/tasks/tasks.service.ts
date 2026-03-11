import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PrismaClient,
  type Prisma,
  type TaskStatusEnum,
  type TaskPriorityEnum,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface CreateTaskDto {
  title: string;
  projectId: string;
  creatorId: string;
  description?: string;
  productId?: string;
  extensionId?: string;
  assigneeId?: string;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  sprintId?: string;
  dueDate?: string;
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  projectId?: string;
  productId?: string;
  extensionId?: string;
  assigneeId?: string;
  coAssignees?: string[];
  observers?: string[];
  priority?: string;
  sprintId?: string;
  dueDate?: string;
}

interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  projectId?: string;
  productId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class TasksService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: TaskQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      projectId,
      productId,
      status,
      priority,
      assigneeId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where = this.buildWhere({ projectId, productId, status, priority, assigneeId, search });

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, code: true, name: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, name: true, productType: true } },
        extension: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(data: CreateTaskDto) {
    const code = await this.generateCode();
    return this.prisma.task.create({
      data: {
        code,
        title: data.title,
        projectId: data.projectId,
        creatorId: data.creatorId,
        description: data.description,
        productId: data.productId,
        extensionId: data.extensionId,
        assigneeId: data.assigneeId,
        coAssignees: data.coAssignees ?? [],
        observers: data.observers ?? [],
        priority: (data.priority as TaskPriorityEnum) ?? 'NORMAL',
        sprintId: data.sprintId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateTaskDto) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.projectId && { projectId: data.projectId }),
        ...(data.productId !== undefined && { productId: data.productId || null }),
        ...(data.extensionId !== undefined && { extensionId: data.extensionId || null }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
        ...(data.coAssignees && { coAssignees: data.coAssignees }),
        ...(data.observers && { observers: data.observers }),
        ...(data.priority && { priority: data.priority as TaskPriorityEnum }),
        ...(data.sprintId !== undefined && { sprintId: data.sprintId || null }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        project: { select: { id: true, code: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.task.update({
      where: { id },
      data: { status: status as TaskStatusEnum },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.task.delete({ where: { id } });
  }

  async getStats() {
    const [byStatus, byPriority] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], _count: true }),
      this.prisma.task.groupBy({ by: ['priority'], _count: true }),
    ]);
    return { byStatus, byPriority };
  }

  private buildWhere(
    filters: Omit<TaskQueryParams, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>,
  ): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.productId) where.productId = filters.productId;
    if (filters.status) where.status = filters.status as TaskStatusEnum;
    if (filters.priority) where.priority = filters.priority as TaskPriorityEnum;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
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
    const last = await this.prisma.task.findFirst({
      where: { code: { startsWith: `T-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `T-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
