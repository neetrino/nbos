import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { RequirePermission, CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import { EmployeesService } from './employees.service';
import { EmployeeOffboardingService } from './employee-offboarding.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly employeeOffboardingService: EmployeeOffboardingService,
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
  ) {}

  @Get()
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get all employees with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'roleId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
    @Query('level') level?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.employeesService.findAllWithFilters({
      search,
      roleId,
      status,
      level,
      departmentId,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id/offboard-preview')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Preview employee offboarding impact' })
  previewOffboard(@Param('id') id: string) {
    return this.employeeOffboardingService.buildPreview(id);
  }

  @Post(':id/offboard')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Offboard employee (terminate + revoke access + checklist)' })
  offboard(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.employeeOffboardingService.execute(id, user.id);
  }

  @Get(':id')
  @RequirePermission('COMPANY', 'VIEW')
  @ApiOperation({ summary: 'Get employee by ID' })
  async findOne(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @RequirePermission('COMPANY', 'ADD')
  @ApiOperation({ summary: 'Create employee' })
  async create(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      email: string;
      roleId: string;
      phone?: string;
      telegram?: string;
      position?: string;
    },
  ) {
    return this.prisma.employee.create({
      data: body,
      include: {
        role: { select: { id: true, name: true, slug: true, level: true } },
        departments: { include: { department: true } },
      },
    });
  }

  @Put(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update employee' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      telegram?: string;
      position?: string;
      level?: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD' | 'HEAD';
      notes?: string;
      hireDate?: string | null;
    },
  ) {
    const { hireDate, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (hireDate !== undefined) {
      data.hireDate = hireDate ? new Date(hireDate) : null;
    }
    return this.prisma.employee.update({
      where: { id },
      data,
      include: {
        role: { select: { id: true, name: true, slug: true, level: true } },
        departments: { include: { department: true } },
      },
    });
  }

  @Patch(':id/status')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Change employee status' })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (body.status === 'TERMINATED') {
      return this.employeeOffboardingService.execute(id, user.id);
    }
    return this.prisma.employee.update({
      where: { id },
      data: { status: body.status as 'ACTIVE' | 'PROBATION' | 'ON_LEAVE' },
      include: {
        role: { select: { id: true, name: true, slug: true, level: true } },
        departments: { include: { department: true } },
      },
    });
  }

  @Patch(':id/role')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Change employee role' })
  async changeRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.prisma.employee.update({
      where: { id },
      data: { roleId: body.roleId },
      include: {
        role: { select: { id: true, name: true, slug: true, level: true } },
      },
    });
  }

  @Post(':id/departments')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Add employee to department' })
  async addDepartment(
    @Param('id') id: string,
    @Body() body: { departmentId: string; deptRole?: string; isPrimary?: boolean },
  ) {
    return this.prisma.employeeDepartment.create({
      data: {
        employeeId: id,
        departmentId: body.departmentId,
        deptRole: body.deptRole ?? 'MEMBER',
        isPrimary: body.isPrimary ?? false,
      },
      include: { department: true },
    });
  }

  @Patch(':id/departments/:deptId')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update employee department assignment' })
  async updateDepartment(
    @Param('id') id: string,
    @Param('deptId') deptId: string,
    @Body() body: { deptRole?: string; isPrimary?: boolean },
  ) {
    const record = await this.prisma.employeeDepartment.findUnique({
      where: { employeeId_departmentId: { employeeId: id, departmentId: deptId } },
    });
    if (!record) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException('Department assignment not found');
    }
    return this.prisma.employeeDepartment.update({
      where: { id: record.id },
      data: body,
      include: { department: true },
    });
  }

  @Delete(':id/departments/:deptId')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Remove employee from department' })
  async removeDepartment(@Param('id') id: string, @Param('deptId') deptId: string) {
    const record = await this.prisma.employeeDepartment.findUnique({
      where: { employeeId_departmentId: { employeeId: id, departmentId: deptId } },
    });
    if (!record) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException('Department assignment not found');
    }
    return this.prisma.employeeDepartment.delete({ where: { id: record.id } });
  }
}
