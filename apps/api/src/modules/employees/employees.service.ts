import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface EmployeeQueryParams {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class EmployeesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllWithFilters(params: EmployeeQueryParams) {
    const { search, role, status, department, page = 1, pageSize = 50 } = params;
    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role as Prisma.EmployeeWhereInput['role'];
    if (status) where.status = status as Prisma.EmployeeWhereInput['status'];
    if (department) where.department = { contains: department, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          _count: {
            select: {
              projectsSelling: true,
              projectsManaging: true,
              tasksAssigned: true,
              tasksCreated: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async findByClerkUserId(clerkUserId: string) {
    return this.prisma.employee.findUnique({ where: { clerkUserId } });
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({ where: { email } });
  }

  async upsertFromClerk(data: {
    clerkUserId: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    return this.prisma.employee.upsert({
      where: { clerkUserId: data.clerkUserId },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      create: {
        clerkUserId: data.clerkUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'DEVELOPER',
      },
    });
  }
}
