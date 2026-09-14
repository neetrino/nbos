import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type TransactionClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import type { CurrentUserPayload } from '../../common/decorators';
import { AuditService } from '../audit/audit.service';
import type { CreateOrgSeatDto, UpdateOrgSeatDto } from './org-seat.dto';
import { ORG_SEAT_INCLUDE } from './org-seat.select';
import { lockOrgSeat } from './org-seat-locks';

@Injectable()
export class OrgSeatsService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  findAll(departmentId?: string) {
    return this.prisma.orgSeat.findMany({
      where: { status: 'ACTIVE', ...(departmentId ? { departmentId } : {}) },
      include: ORG_SEAT_INCLUDE,
      orderBy: [{ department: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  async findById(id: string) {
    const seat = await this.prisma.orgSeat.findUnique({
      where: { id },
      include: ORG_SEAT_INCLUDE,
    });
    if (!seat) throw new NotFoundException(`Org seat ${id} not found`);
    return seat;
  }

  async history(id: string) {
    await this.findById(id);
    return this.prisma.orgSeatAssignment.findMany({
      where: { seatId: id },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true } },
        endedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ startsAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }

  async create(body: CreateOrgSeatDto, actor: CurrentUserPayload) {
    if (body.defaultPermissionRoleId)
      await this.assertMappingAllowed(body.defaultPermissionRoleId, actor);
    return this.prisma.$transaction(async (tx) => {
      await this.assertDepartmentExists(tx, body.departmentId);
      const seat = await tx.orgSeat.create({
        data: {
          ...body,
          title: body.title.trim(),
          description: body.description?.trim() || null,
        },
      });
      if (body.kind === 'HEAD') {
        await this.claimHeadSeat(tx, body.departmentId, seat.id);
      }
      await this.audit.log(
        {
          entityType: 'org_seat',
          entityId: seat.id,
          action: 'org_seat.created',
          userId: actor.id,
          changes: { departmentId: body.departmentId, title: seat.title, kind: seat.kind },
        },
        tx,
      );
      return tx.orgSeat.findUniqueOrThrow({ where: { id: seat.id }, include: ORG_SEAT_INCLUDE });
    });
  }

  async update(id: string, body: UpdateOrgSeatDto, actor: CurrentUserPayload) {
    return this.prisma.$transaction(async (tx) => {
      await lockOrgSeat(tx, id);
      const current = await tx.orgSeat.findUnique({ where: { id }, include: ORG_SEAT_INCLUDE });
      if (!current) throw new NotFoundException(`Org seat ${id} not found`);
      if (current.status !== 'ACTIVE')
        throw new BadRequestException('Archived seats cannot be edited.');
      if (
        current.assignments.length > 0 &&
        ((body.defaultPermissionRoleId !== undefined &&
          body.defaultPermissionRoleId !== current.defaultPermissionRoleId) ||
          (body.kind !== undefined && body.kind !== current.kind))
      ) {
        throw new BadRequestException(
          'End the active seat assignment before changing its kind or permission role.',
        );
      }
      if (
        body.defaultPermissionRoleId !== undefined &&
        body.defaultPermissionRoleId !== current.defaultPermissionRoleId
      ) {
        await this.assertMappingAllowed(body.defaultPermissionRoleId, actor);
      }
      const seat = await tx.orgSeat.update({
        where: { id },
        data: {
          ...body,
          title: body.title?.trim(),
          description:
            body.description === undefined ? undefined : body.description?.trim() || null,
        },
      });
      await this.syncHeadSeat(tx, current.departmentId, seat.id, current.kind, seat.kind);
      await this.audit.log(
        {
          entityType: 'org_seat',
          entityId: id,
          action: 'org_seat.updated',
          userId: actor.id,
          changes: { before: seatSnapshot(current), after: seatSnapshot(seat) },
        },
        tx,
      );
      return tx.orgSeat.findUniqueOrThrow({ where: { id }, include: ORG_SEAT_INCLUDE });
    });
  }

  async archive(id: string, actor: CurrentUserPayload) {
    return this.prisma.$transaction(async (tx) => {
      await lockOrgSeat(tx, id);
      const seat = await tx.orgSeat.findUnique({ where: { id }, include: ORG_SEAT_INCLUDE });
      if (!seat) throw new NotFoundException(`Org seat ${id} not found`);
      if (seat.assignments.length > 0) {
        throw new BadRequestException('End the active seat assignment before archiving the seat.');
      }
      const archived = await tx.orgSeat.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
      await tx.department.updateMany({
        where: { id: seat.departmentId, headSeatId: id },
        data: { headSeatId: null },
      });
      await this.audit.log(
        {
          entityType: 'org_seat',
          entityId: id,
          action: 'org_seat.archived',
          userId: actor.id,
          changes: { title: seat.title },
        },
        tx,
      );
      return archived;
    });
  }

  private async assertMappingAllowed(
    roleId: string | null | undefined,
    actor: CurrentUserPayload,
  ): Promise<void> {
    if (roleId === undefined) return;
    if (!hasPermission(actor, 'SETTINGS_RBAC_EDIT')) {
      throw new ForbiddenException('SETTINGS_RBAC.EDIT is required to map a permission role.');
    }
    if (roleId === null) return;
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { assignable: true, archivedAt: true },
    });
    if (!role?.assignable) throw new BadRequestException('Permission role is not assignable.');
    if (role.archivedAt) throw new BadRequestException('Permission role is archived.');
  }

  private async assertDepartmentExists(tx: TransactionClient, departmentId: string): Promise<void> {
    const department = await tx.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department) throw new NotFoundException(`Department ${departmentId} not found`);
  }

  private async syncHeadSeat(
    tx: TransactionClient,
    departmentId: string,
    seatId: string,
    previousKind: string,
    nextKind: string,
  ): Promise<void> {
    if (nextKind === 'HEAD') {
      await this.claimHeadSeat(tx, departmentId, seatId);
      return;
    }
    if (previousKind === 'HEAD') {
      await tx.department.updateMany({
        where: { id: departmentId, headSeatId: seatId },
        data: { headSeatId: null },
      });
    }
  }

  private async claimHeadSeat(
    tx: TransactionClient,
    departmentId: string,
    seatId: string,
  ): Promise<void> {
    const result = await tx.department.updateMany({
      where: {
        id: departmentId,
        OR: [{ headSeatId: null }, { headSeatId: seatId }],
      },
      data: { headSeatId: seatId },
    });
    if (result.count !== 1) {
      throw new BadRequestException('Department already has a different head seat.');
    }
  }
}

function hasPermission(actor: CurrentUserPayload, key: string): boolean {
  const scope = actor.permissions[key];
  return Boolean(scope && scope !== 'NONE');
}

function seatSnapshot(seat: {
  title: string;
  description: string | null;
  kind: string;
  defaultPermissionRoleId: string | null;
  sortOrder: number;
}) {
  return {
    title: seat.title,
    description: seat.description,
    kind: seat.kind,
    defaultPermissionRoleId: seat.defaultPermissionRoleId,
    sortOrder: seat.sortOrder,
  };
}
