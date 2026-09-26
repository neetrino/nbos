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
  BadRequestException,
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
import { roleAssignmentAuthority } from '../platform-ownership/role-assignment-authority';
import { lockSeatEmployee } from '../org-seats/org-seat-locks';
import { DEPARTMENT_ROLE_MEMBER } from '../departments/department-member.constants';
import { isDepartmentLeadershipRole } from '../departments/department-seat-leadership';
import {
  AddEmployeeDepartmentDto,
  UpdateEmployeeDepartmentDto,
  type EmployeeDeptRole,
} from './employee-department.dto';

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
  @ApiQuery({
    name: 'excludeStatus',
    required: false,
    description: 'Omit this status when `status` is unset. Used to hide terminated employees.',
  })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
    @Query('excludeStatus') excludeStatus?: string,
    @Query('level') level?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.employeesService.findAllWithFilters({
      search,
      roleId,
      status,
      excludeStatus,
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
      roleAssignmentAuthority(user.role),
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
    @Body() body: AddEmployeeDepartmentDto,
  ) {
    await this.ownership.assertFounderNotMutatedByOthers(user.id, id);
    await this.assertDeptRoleAllowed(body.departmentId, body.deptRole);
    return this.prisma.$transaction(async (tx) => {
      await lockSeatEmployee(tx, id);
      const membership = await tx.employeeDepartment.create({
        data: {
          employeeId: id,
          departmentId: body.departmentId,
          deptRole: body.deptRole ?? DEPARTMENT_ROLE_MEMBER,
          isPrimary: body.isPrimary ?? false,
        },
        include: { department: true },
      });
      await tx.employee.update({
        where: { id },
        data: { accessVersion: { increment: 1 } },
      });
      return membership;
    });
  }

  @Patch(':id/departments/:deptId')
  @RequirePermission('COMPANY', 'EDIT')
  @ApiOperation({ summary: 'Update employee department assignment' })
  async updateDepartment(
    @Param('id') id: string,
    @Param('deptId') deptId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: UpdateEmployeeDepartmentDto,
  ) {
    await this.ownership.assertFounderNotMutatedByOthers(user.id, id);
    await this.assertDeptRoleAllowed(deptId, body.deptRole);
    const record = await this.prisma.employeeDepartment.findUnique({
      where: { employeeId_departmentId: { employeeId: id, departmentId: deptId } },
    });
    if (!record) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException('Department assignment not found');
    }
    return this.prisma.$transaction(async (tx) => {
      await lockSeatEmployee(tx, id);
      if (
        body.isPrimary !== undefined &&
        (await tx.orgSeatAssignment.count({
          where: { employeeId: id, status: { in: ['ACTIVE', 'TEMPORARY'] }, endsAt: null },
        }))
      ) {
        throw new BadRequestException(
          'Manage the primary assignment through Seats while active seats exist.',
        );
      }
      const membership = await tx.employeeDepartment.update({
        where: { id: record.id },
        data: body,
        include: { department: true },
      });
      // An explicit membership edit adopts the row as a manually managed membership.
      await tx.orgSeatAssignment.updateMany({
        where: {
          employeeId: id,
          seat: { departmentId: deptId },
          status: { in: ['ACTIVE', 'TEMPORARY'] },
          endsAt: null,
        },
        data: { membershipProvisioned: false },
      });
      await tx.employee.update({
        where: { id },
        data: { accessVersion: { increment: 1 } },
      });
      return membership;
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
    return this.prisma.$transaction(async (tx) => {
      await lockSeatEmployee(tx, id);
      const activeSeats = await tx.orgSeatAssignment.count({
        where: {
          employeeId: id,
          seat: { departmentId: deptId },
          status: { in: ['ACTIVE', 'TEMPORARY'] },
          endsAt: null,
        },
      });
      if (activeSeats > 0)
        throw new BadRequestException('End active seats before removing department membership.');
      const membership = await tx.employeeDepartment.delete({ where: { id: record.id } });
      await tx.employee.update({
        where: { id },
        data: { accessVersion: { increment: 1 } },
      });
      return membership;
    });
  }

  /** Once a department has seats, `Department.headSeatId` is the only source of leadership. */
  private async assertDeptRoleAllowed(
    departmentId: string,
    deptRole: EmployeeDeptRole | undefined,
  ): Promise<void> {
    if (!deptRole || !isDepartmentLeadershipRole(deptRole)) return;
    const seats = await this.prisma.orgSeat.count({
      where: { departmentId, status: 'ACTIVE' },
    });
    if (seats > 0) {
      throw new BadRequestException(
        'Department leadership is defined by its head or deputy seat, not by membership role.',
      );
    }
  }
}
