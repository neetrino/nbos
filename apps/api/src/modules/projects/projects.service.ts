import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import {
  ProjectKickoffChecklistService,
  type UpdateKickoffChecklistItemDto,
} from './project-kickoff-checklist.service';
import { projectDetailInclude } from './project.includes';
import { buildProjectIntake } from './project-intake';

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
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly kickoffChecklist: ProjectKickoffChecklistService,
  ) {}

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
      include: projectDetailInclude,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    const kickoffChecklist = await this.kickoffChecklist.ensureForProject(id);
    return { ...project, intake: buildProjectIntake(project), kickoffChecklist };
  }

  updateKickoffChecklistItem(id: string, itemId: string, data: UpdateKickoffChecklistItemDto) {
    return this.kickoffChecklist.updateItem(id, itemId, data);
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
