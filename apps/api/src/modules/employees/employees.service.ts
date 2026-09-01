import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
import { buildOwnProfileUpdateData } from './employee-own-profile';

interface EmployeeQueryParams {
  search?: string;
  roleId?: string;
  status?: string;
  level?: string;
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
    const { search, roleId, status, level, departmentId, page = 1, pageSize = 50 } = params;
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
    if (level) where.level = level as Prisma.EmployeeWhereInput['level'];
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

  async updateOwnProfile(employeeId: string, body: UpdateOwnProfileDto) {
    const data = buildOwnProfileUpdateData(body);
    if (Object.keys(data).length === 0) {
      return this.findById(employeeId);
    }
    await this.prisma.employee.update({ where: { id: employeeId }, data });
    return this.findById(employeeId);
  }
}
