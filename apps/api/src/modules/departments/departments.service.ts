import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        members: {
          include: {
            employee: {
              include: {
                role: { select: { id: true, name: true, slug: true, level: true } },
              },
            },
          },
        },
      },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return department;
  }

  async create(
    data: {
      name: string;
      slug: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    },
    actorId: string,
  ) {
    const department = await this.prisma.department.create({
      data,
    });
    await this.logDepartmentChange('DEPARTMENT_CREATED', department.id, actorId, {
      after: this.toDepartmentAuditSnapshot(department),
    });
    return department;
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      parentId?: string;
      sortOrder?: number;
    },
    actorId: string,
  ) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    const updated = await this.prisma.department.update({
      where: { id },
      data,
    });
    await this.logDepartmentChange('DEPARTMENT_UPDATED', id, actorId, {
      before: this.toDepartmentAuditSnapshot(department),
      after: this.toDepartmentAuditSnapshot(updated),
    });
    return updated;
  }

  async remove(id: string, actorId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    if (department._count.members > 0) {
      throw new BadRequestException('Cannot delete department with members');
    }
    const deleted = await this.prisma.department.delete({ where: { id } });
    await this.logDepartmentChange('DEPARTMENT_DELETED', id, actorId, {
      before: this.toDepartmentAuditSnapshot(department),
    });
    return deleted;
  }

  private async logDepartmentChange(
    action: string,
    entityId: string,
    userId: string,
    changes: InputJsonValue,
  ): Promise<void> {
    await this.auditService.log({
      entityType: 'Department',
      entityId,
      action,
      userId,
      changes,
    });
  }

  private toDepartmentAuditSnapshot(department: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    sortOrder: number;
  }): InputJsonValue {
    return {
      id: department.id,
      name: department.name,
      slug: department.slug,
      description: department.description,
      parentId: department.parentId,
      sortOrder: department.sortOrder,
    };
  }
}
