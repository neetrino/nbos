import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { AuditService } from '../audit/audit.service';
import { PlatformOwnershipService } from '../platform-ownership/platform-ownership.service';
import { roleAssignmentAuthority } from '../platform-ownership/role-assignment-authority';
import type { AssignOrgSeatDto } from './org-seat.dto';
import {
  ensureSeatDepartmentMembership,
  reconcileSeatDepartmentMembership,
} from './org-seat-membership.ops';
import { ORG_SEAT_EMPLOYEE_SELECT, ORG_SEAT_INCLUDE } from './org-seat.select';
import { lockOrgSeat, lockSeatEmployee } from './org-seat-locks';

@Injectable()
export class OrgSeatAssignmentsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
    private readonly ownership: PlatformOwnershipService,
  ) {}

  async assign(seatId: string, body: AssignOrgSeatDto, actor: CurrentUserPayload) {
    await this.ownership.assertFounderNotMutatedByOthers(actor.id, body.employeeId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockSeatEmployee(tx, body.employeeId);
        await lockOrgSeat(tx, seatId);
        const seat = await this.loadAssignableSeat(seatId, tx);
        await this.assertEmployeeCanTakeSeat(body.employeeId, tx);
        if (seat.defaultPermissionRoleId) {
          await this.ownership.assertCanAssignRole({
            actorId: actor.id,
            actorRoleSlug: roleAssignmentAuthority(actor.role),
            targetEmployeeId: body.employeeId,
            targetRoleId: seat.defaultPermissionRoleId,
          });
        }
        return this.createAssignment(tx, seat, body, actor.id);
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Seat already has an active assignment.');
      }
      throw error;
    }
  }

  async end(assignmentId: string, actor: CurrentUserPayload, reason?: string) {
    const assignment = await this.prisma.orgSeatAssignment.findUnique({
      where: { id: assignmentId },
      include: { seat: { select: { id: true, title: true, departmentId: true } } },
    });
    if (!assignment) throw new NotFoundException(`Seat assignment ${assignmentId} not found`);
    await this.ownership.assertFounderNotMutatedByOthers(actor.id, assignment.employeeId);
    return this.prisma.$transaction(async (tx) => {
      await lockSeatEmployee(tx, assignment.employeeId);
      await lockOrgSeat(tx, assignment.seatId);
      const current = await tx.orgSeatAssignment.findUniqueOrThrow({
        where: { id: assignmentId },
        include: { seat: { select: { id: true, title: true, departmentId: true } } },
      });
      if (current.status === 'ENDED') {
        throw new BadRequestException('Seat assignment has already ended.');
      }
      const grant = await tx.permissionRoleAssignment.findUnique({
        where: { seatAssignmentId: assignmentId },
      });
      if (grant && !grant.revokedAt) {
        await this.ownership.assertCanAssignRole({
          actorId: actor.id,
          actorRoleSlug: roleAssignmentAuthority(actor.role),
          targetEmployeeId: current.employeeId,
          targetRoleId: grant.roleId,
        });
      }
      const now = new Date(Math.max(Date.now(), current.startsAt.getTime()));
      const ended = await tx.orgSeatAssignment.update({
        where: { id: assignmentId },
        data: { status: 'ENDED', endsAt: now, endedById: actor.id },
      });
      await tx.permissionRoleAssignment.updateMany({
        where: { seatAssignmentId: assignmentId, revokedAt: null },
        data: { revokedAt: now, effectiveTo: now, revokedById: actor.id },
      });
      await reconcileSeatDepartmentMembership(tx, current);
      await tx.employee.update({
        where: { id: assignment.employeeId },
        data: { accessVersion: { increment: 1 } },
      });
      await this.audit.log(
        {
          entityType: 'org_seat_assignment',
          entityId: assignmentId,
          action: 'org_seat_assignment.ended',
          userId: actor.id,
          changes: {
            seatId: assignment.seatId,
            employeeId: assignment.employeeId,
            reason: reason ?? null,
          },
        },
        tx,
      );
      return ended;
    });
  }

  private async loadAssignableSeat(seatId: string, tx: TransactionClient) {
    const seat = await tx.orgSeat.findUnique({
      where: { id: seatId },
      include: ORG_SEAT_INCLUDE,
    });
    if (!seat || seat.status !== 'ACTIVE') {
      throw new NotFoundException(`Active org seat ${seatId} not found`);
    }
    if (seat.assignments.length > 0) {
      throw new ConflictException('Seat already has an active assignment.');
    }
    return seat;
  }

  private async assertEmployeeCanTakeSeat(
    employeeId: string,
    tx: TransactionClient,
  ): Promise<void> {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
      select: { status: true },
    });
    if (!employee || employee.status === 'TERMINATED') {
      throw new BadRequestException('Seat assignee must be an active employee.');
    }
  }

  private async createAssignment(
    tx: TransactionClient,
    seat: Awaited<ReturnType<OrgSeatAssignmentsService['loadAssignableSeat']>>,
    body: AssignOrgSeatDto,
    actorId: string,
  ) {
    const membership = await ensureSeatDepartmentMembership(tx, seat, body);
    const assignment = await tx.orgSeatAssignment.create({
      data: {
        seatId: seat.id,
        employeeId: body.employeeId,
        status: body.status ?? 'ACTIVE',
        allocationPct: body.allocationPct ?? 100,
        isPrimary: body.isPrimary ?? false,
        membershipProvisioned: membership.provisioned,
        previousPrimaryDepartmentId: membership.previousPrimaryDepartmentId,
        assignedById: actorId,
      },
      include: { employee: { select: ORG_SEAT_EMPLOYEE_SELECT } },
    });
    await this.createPermissionGrant(tx, seat, assignment.id, body.employeeId, actorId);
    await tx.employee.update({
      where: { id: body.employeeId },
      data: { accessVersion: { increment: 1 } },
    });
    await this.audit.log(
      {
        entityType: 'org_seat_assignment',
        entityId: assignment.id,
        action: 'org_seat_assignment.created',
        userId: actorId,
        changes: { seatId: seat.id, employeeId: body.employeeId },
      },
      tx,
    );
    return assignment;
  }

  private async createPermissionGrant(
    tx: TransactionClient,
    seat: { id: string; departmentId: string; defaultPermissionRoleId: string | null },
    seatAssignmentId: string,
    employeeId: string,
    actorId: string,
  ): Promise<void> {
    if (!seat.defaultPermissionRoleId) return;
    await tx.permissionRoleAssignment.create({
      data: {
        employeeId,
        roleId: seat.defaultPermissionRoleId,
        source: 'SEAT',
        seatAssignmentId,
        scopeDepartmentId: seat.departmentId,
        assignedById: actorId,
        reason: `Granted by org seat ${seat.id}`,
      },
    });
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    ((error as { code?: unknown }).code === 'P2002' ||
      (error as { code?: unknown }).code === '23505'),
  );
}
