import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

@Injectable()
export class DepartmentsService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

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

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    return this.prisma.department.create({
      data,
    });
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
  ) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
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
    return this.prisma.department.delete({ where: { id } });
  }
}
