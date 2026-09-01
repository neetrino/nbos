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
import {
  RequirePermission,
  RequireActiveSession,
  CurrentUser,
  type CurrentUserPayload,
} from '../../common/decorators';
import { EmployeesService } from './employees.service';
import { EmployeeOffboardingService } from './employee-offboarding.service';
import { EmployeeReactivationService } from './employee-reactivation.service';
import { EmployeeRoleAssignmentService } from './employee-role-assignment.service';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly employeeOffboardingService: EmployeeOffboardingService,
    private readonly employeeReactivationService: EmployeeReactivationService,
    private readonly roleAssignment: EmployeeRoleAssignmentService,
    private readonly ownership: PlatformOwnershipService,
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
  async previewOffboard(@Param('id') id: string) {
    await this.ownership.assertFounderNotTarget(id);
    return this.employeeOffboardingService.buildPreview(id);
  }

  @Post(':id/offboard')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Offboard employee (terminate + revoke access + checklist)' })
  async offboard(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    await this.ownership.assertFounderNotTarget(id);
    return this.employeeOffboardingService.execute(id, user.id);
  }

  @Post(':id/reactivate')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Reactivate terminated employee (rehire + onboarding checklist)' })
  async reactivate(
    @Param('id') id: string,
    @Body() body: { status?: 'ACTIVE' | 'PROBATION' },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.ownership.assertFounderNotTarget(id);
    const status = body.status === 'PROBATION' ? 'PROBATION' : 'ACTIVE';
    return this.employeeReactivationService.execute(
      id,
      user.id,
      user.role,
      { status },
      user.isPlatformOwner === true,
    );
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
    @CurrentUser() user: CurrentUserPayload,
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
    return this.roleAssignment.createEmployee(user, body);
  }

  @Put(':id')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update employee' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      telegram?: string;
      sipId?: string | null;
      position?: string;
      level?: 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD' | 'HEAD';
      notes?: string;
      hireDate?: string | null;
      birthday?: string | null;
    },
  ) {
    await this.ownership.assertFounderNotMutatedByOthers(user.id, id);
    const { hireDate, birthday, sipId, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (hireDate !== undefined) {
      data.hireDate = hireDate ? new Date(hireDate) : null;
    }
    if (birthday !== undefined) {
      data.birthday = birthday ? new Date(birthday) : null;
    }
    if (sipId !== undefined) {
      const trimmed = typeof sipId === 'string' ? sipId.trim() : '';
      data.sipId = trimmed.length > 0 ? trimmed : null;
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
  @RequireActiveSession()
  @ApiOperation({ summary: 'Change employee status' })
  async changeStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.ownership.assertFounderNotTarget(id);
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
  @RequireActiveSession()
  @ApiOperation({ summary: 'Change employee role' })
  async changeRole(
    @Param('id') id: string,
    @Body() body: { roleId: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.roleAssignment.changeRole(user, id, body.roleId);
  }

  @Post(':id/departments')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Add employee to department' })
  async addDepartment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { departmentId: string; deptRole?: string; isPrimary?: boolean },
  ) {
    await this.ownership.assertFounderNotMutatedByOthers(user.id, id);
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
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { deptRole?: string; isPrimary?: boolean },
  ) {
    await this.ownership.assertFounderNotMutatedByOthers(user.id, id);
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
  async removeDepartment(
    @Param('id') id: string,
    @Param('deptId') deptId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.ownership.assertFounderNotMutatedByOthers(user.id, id);
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
