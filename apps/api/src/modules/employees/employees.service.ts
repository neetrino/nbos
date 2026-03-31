import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';

interface EmployeeQueryParams {
  search?: string;
  roleId?: string;
  status?: string;
  departmentId?: string;
  page?: number;
  pageSize?: number;
}

const EMPLOYEE_INCLUDE = {
  role: { select: { id: true, name: true, slug: true, level: true } },
  departments: {
    include: { department: { select: { id: true, name: true, slug: true } } },
  },
  _count: {
    select: {
      dealsSelling: true,
      productsManaging: true,
      tasksAssigned: true,
      tasksCreated: true,
    },
  },
} as const;

@Injectable()
export class EmployeesService {
  constructor(@Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>) {}

  async findAll() {
    return this.prisma.employee.findMany({
      include: EMPLOYEE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllWithFilters(params: EmployeeQueryParams) {
    const { search, roleId, status, departmentId, page = 1, pageSize = 50 } = params;
    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (roleId) where.roleId = roleId;
    if (status) where.status = status as Prisma.EmployeeWhereInput['status'];
    if (departmentId) {
      where.departments = { some: { departmentId } };
    }

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: EMPLOYEE_INCLUDE,
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
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email },
      include: EMPLOYEE_INCLUDE,
    });
  }
}
