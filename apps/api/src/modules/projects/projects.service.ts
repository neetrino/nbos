import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface CreateProjectDto {
  name: string;
  contactId: string;
  description?: string;
  companyId?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string;
  companyId?: string;
  contactId?: string;
  isArchived?: boolean;
}

interface ProjectQueryParams {
  page?: number;
  pageSize?: number;
  isArchived?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll(params: ProjectQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      isArchived,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.ProjectWhereInput = {};
    if (isArchived !== undefined) where.isArchived = isArchived;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        orders: {
          include: {
            invoices: {
              select: {
                id: true,
                code: true,
                status: true,
                amount: true,
                type: true,
                dueDate: true,
                paidDate: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        tickets: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
            contact: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        credentials: {
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          include: {
            invoices: {
              select: {
                id: true,
                code: true,
                status: true,
                amount: true,
                dueDate: true,
                paidDate: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        domains: {
          orderBy: { expiryDate: 'asc' },
        },
        expenses: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            orders: true,
            tickets: true,
            credentials: true,
            expenses: true,
          },
        },
      },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(data: CreateProjectDto) {
    const code = await this.generateCode();
    return this.prisma.project.create({
      data: {
        code,
        name: data.name,
        contactId: data.contactId,
        description: data.description,
        companyId: data.companyId,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateProjectDto) {
    await this.findById(id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.companyId !== undefined && { companyId: data.companyId || null }),
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.project.delete({ where: { id } });
  }

  async getStats() {
    const total = await this.prisma.project.count();
    return { total };
  }

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.project.findFirst({
      where: { code: { startsWith: `P-${year}-` } },
      orderBy: { code: 'desc' },
    });
    const nextNum = last ? parseInt(last.code.split('-')[2] ?? '0', 10) + 1 : 1;
    return `P-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
