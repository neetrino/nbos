import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  DEPARTMENT_LEADERSHIP_ROLES,
  DEPARTMENT_MEMBER_EMPLOYEE_SELECT,
  sortDepartmentLeadership,
} from './department-member.constants';
import {
  applySeatLeadership,
  buildSeatLeadershipIndex,
  isDepartmentLeadershipRole,
  type SeatLeadershipIndex,
} from './department-seat-leadership';
import { ACTIVE_SEAT_ASSIGNMENT_WHERE } from '../org-seats/org-seat.select';

const SEAT_LEADERSHIP_SELECT = {
  id: true,
  departmentId: true,
  kind: true,
  department: { select: { headSeatId: true } },
  assignments: { where: ACTIVE_SEAT_ASSIGNMENT_WHERE, select: { employeeId: true } },
} as const;

const DEPARTMENT_DETAIL_INCLUDE = {
  parent: { select: { id: true, name: true, slug: true } },
  members: {
    include: { employee: { select: DEPARTMENT_MEMBER_EMPLOYEE_SELECT } },
  },
  _count: { select: { members: true } },
} as const;

@Injectable()
export class DepartmentsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    const leadership = await this.loadSeatLeadership();
    const seatLeaderIds = [
      ...new Set([...leadership.values()].flatMap((byEmployee) => [...byEmployee.keys()])),
    ];
    const departments = await this.prisma.department.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { members: true } },
        members: {
          where: {
            OR: [
              { deptRole: { in: Array.from(DEPARTMENT_LEADERSHIP_ROLES) } },
              { employeeId: { in: seatLeaderIds } },
            ],
          },
          include: { employee: { select: DEPARTMENT_MEMBER_EMPLOYEE_SELECT } },
        },
      },
    });
    return departments.map((department) => ({
      ...department,
      members: sortDepartmentLeadership(
        applySeatLeadership(department.members, leadership.get(department.id)).filter((member) =>
          isDepartmentLeadershipRole(member.deptRole),
        ),
      ),
    }));
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: DEPARTMENT_DETAIL_INCLUDE,
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    const leadership = await this.loadSeatLeadership(id);
    return {
      ...department,
      members: applySeatLeadership(department.members, leadership.get(id)),
    };
  }

  /** Departments absent from the index have no seats and keep their legacy `deptRole`. */
  private async loadSeatLeadership(departmentId?: string): Promise<SeatLeadershipIndex> {
    const seats = await this.prisma.orgSeat.findMany({
      where: { status: 'ACTIVE', ...(departmentId ? { departmentId } : {}) },
      select: SEAT_LEADERSHIP_SELECT,
    });
    return buildSeatLeadershipIndex(seats);
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
      include: { _count: { select: { members: true, seats: true } } },
    });
    if (!department) {
      throw new NotFoundException(`Department ${id} not found`);
    }
    if (department._count.members > 0) {
      throw new BadRequestException('Cannot delete department with members');
    }
    if (department._count.seats > 0) {
      throw new BadRequestException('Cannot delete department with seat history');
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
