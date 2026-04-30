import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PrismaClient, type InputJsonValue, type Prisma } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  deliveryExtensionWhere,
  deliveryProductWhere,
  isWideCalendarScope,
} from './calendar-access';
import { extensionDeadlineProjection, productDeadlineProjection } from './calendar-projections';
import type {
  CalendarEventProjection,
  CalendarLayer,
  CalendarRangeQuery,
  CreateCalendarMeetingDto,
  CreatePersonalCalendarEventDto,
  UpdateCalendarMeetingDto,
  UpdatePersonalCalendarEventDto,
} from './calendar.types';

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) {
    if (Number.isNaN(fallback.getTime())) {
      throw new BadRequestException('Date value is required.');
    }
    return fallback;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid date query.');
  }
  return parsed;
}

function currentMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

function parseLayer(layer: CalendarLayer | undefined): CalendarLayer {
  return layer === 'MEETINGS' || layer === 'DELIVERY_DEADLINES' || layer === 'PERSONAL'
    ? layer
    : 'ALL';
}

function assertDateOrder(startsAt: Date, endsAt: Date) {
  if (endsAt <= startsAt) {
    throw new BadRequestException('endsAt must be after startsAt.');
  }
}

function normalizeParticipants(ids: string[] | undefined, actorId: string): string[] {
  return Array.from(new Set([actorId, ...(ids ?? [])].filter(Boolean)));
}

@Injectable()
export class CalendarService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly audit: AuditService,
  ) {}

  async listEvents(userId: string, accessScope: string, query: CalendarRangeQuery) {
    const defaults = currentMonthRange();
    const from = parseDate(query.from, defaults.from);
    const to = parseDate(query.to, defaults.to);
    assertDateOrder(from, to);

    const layer = parseLayer(query.layer);
    const groups = await Promise.all([
      layer === 'ALL' || layer === 'MEETINGS'
        ? this.listMeetings(userId, accessScope, from, to)
        : [],
      layer === 'ALL' || layer === 'DELIVERY_DEADLINES'
        ? this.listDeliveryDeadlines(userId, accessScope, from, to)
        : [],
      layer === 'ALL' || layer === 'PERSONAL' ? this.listPersonalEvents(userId, from, to) : [],
    ]);
    return groups.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async createMeeting(userId: string, body: CreateCalendarMeetingDto) {
    const title = body.title?.trim();
    if (!title) throw new BadRequestException('title is required.');
    const startsAt = parseDate(body.startsAt, new Date(NaN));
    const endsAt = parseDate(body.endsAt, new Date(NaN));
    assertDateOrder(startsAt, endsAt);

    const meeting = await this.prisma.calendarMeeting.create({
      data: {
        title,
        startsAt,
        endsAt,
        meetingType: body.meetingType ?? 'SALES_CALL',
        locationType: body.locationType ?? 'ONLINE',
        locationOrLink: body.locationOrLink ?? null,
        agenda: body.agenda ?? null,
        outcomeNotes: body.outcomeNotes ?? null,
        status: body.status ?? 'SCHEDULED',
        internalParticipantIds: normalizeParticipants(body.internalParticipantIds, userId),
        externalParticipants: body.externalParticipants as InputJsonValue | undefined,
        projectId: body.projectId ?? null,
        productId: body.productId ?? null,
        dealId: body.dealId ?? null,
        contactId: body.contactId ?? null,
        createdById: userId,
      },
    });
    await this.audit.log({
      entityType: 'CalendarMeeting',
      entityId: meeting.id,
      action: 'calendar.meeting_created',
      userId,
      projectId: meeting.projectId ?? undefined,
    });
    return meeting;
  }

  async updateMeeting(
    userId: string,
    accessScope: string,
    id: string,
    body: UpdateCalendarMeetingDto,
  ) {
    const existing = await this.getMeetingForMutation(userId, accessScope, id);
    const startsAt = body.startsAt
      ? parseDate(body.startsAt, existing.startsAt)
      : existing.startsAt;
    const endsAt = body.endsAt ? parseDate(body.endsAt, existing.endsAt) : existing.endsAt;
    assertDateOrder(startsAt, endsAt);

    const meeting = await this.prisma.calendarMeeting.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        startsAt,
        endsAt,
        ...(body.meetingType !== undefined && { meetingType: body.meetingType }),
        ...(body.locationType !== undefined && { locationType: body.locationType }),
        ...(body.locationOrLink !== undefined && { locationOrLink: body.locationOrLink }),
        ...(body.agenda !== undefined && { agenda: body.agenda }),
        ...(body.outcomeNotes !== undefined && { outcomeNotes: body.outcomeNotes }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.internalParticipantIds !== undefined && {
          internalParticipantIds: normalizeParticipants(
            body.internalParticipantIds,
            existing.createdById,
          ),
        }),
      },
    });
    await this.audit.log({
      entityType: 'CalendarMeeting',
      entityId: id,
      action: 'calendar.meeting_updated',
      userId,
      projectId: meeting.projectId ?? undefined,
    });
    return meeting;
  }

  async createPersonalEvent(userId: string, body: CreatePersonalCalendarEventDto) {
    const title = body.title?.trim();
    if (!title) throw new BadRequestException('title is required.');
    const startsAt = parseDate(body.startsAt, new Date(NaN));
    const endsAt = parseDate(body.endsAt, new Date(NaN));
    assertDateOrder(startsAt, endsAt);

    return this.prisma.personalCalendarEvent.create({
      data: {
        ownerId: userId,
        title,
        startsAt,
        endsAt,
        isAllDay: body.isAllDay ?? false,
        notes: body.notes ?? null,
        status: body.status ?? 'ACTIVE',
      },
    });
  }

  async updatePersonalEvent(userId: string, id: string, body: UpdatePersonalCalendarEventDto) {
    const existing = await this.prisma.personalCalendarEvent.findFirst({
      where: { id, ownerId: userId },
    });
    if (!existing) throw new ForbiddenException('Personal calendar event is not accessible.');
    const startsAt = body.startsAt
      ? parseDate(body.startsAt, existing.startsAt)
      : existing.startsAt;
    const endsAt = body.endsAt ? parseDate(body.endsAt, existing.endsAt) : existing.endsAt;
    assertDateOrder(startsAt, endsAt);

    return this.prisma.personalCalendarEvent.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        startsAt,
        endsAt,
        ...(body.isAllDay !== undefined && { isAllDay: body.isAllDay }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });
  }

  private async getMeetingForMutation(userId: string, accessScope: string, id: string) {
    const meeting = await this.prisma.calendarMeeting.findUnique({ where: { id } });
    if (!meeting) throw new ForbiddenException('Calendar meeting is not accessible.');
    if (isWideCalendarScope(accessScope) || meeting.createdById === userId) return meeting;
    if (meeting.internalParticipantIds.includes(userId)) return meeting;
    throw new ForbiddenException('Calendar meeting is not accessible.');
  }

  private listMeetings(userId: string, accessScope: string, from: Date, to: Date) {
    const visibility: Prisma.CalendarMeetingWhereInput = isWideCalendarScope(accessScope)
      ? {}
      : { OR: [{ createdById: userId }, { internalParticipantIds: { has: userId } }] };
    return this.prisma.calendarMeeting
      .findMany({
        where: { startsAt: { lt: to }, endsAt: { gt: from }, ...visibility },
        orderBy: { startsAt: 'asc' },
      })
      .then((rows) =>
        rows.map<CalendarEventProjection>((row) => ({
          id: `meeting:${row.id}`,
          layer: 'MEETINGS',
          title: row.title,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          isAllDay: false,
          description: row.agenda,
          status: row.status,
          sourceType: 'MEETING',
          sourceId: row.id,
          sourceHref: null,
          badge: row.meetingType,
          projectName: null,
          ownerName: null,
        })),
      );
  }

  private async listDeliveryDeadlines(userId: string, scope: string, from: Date, to: Date) {
    const [products, extensions] = await Promise.all([
      this.prisma.product.findMany({
        where: deliveryProductWhere(userId, scope, from, to),
        include: { project: { select: { id: true, name: true } }, pm: true },
        orderBy: { deadline: 'asc' },
      }),
      this.prisma.extension.findMany({
        where: deliveryExtensionWhere(userId, scope, from, to),
        include: { project: { select: { id: true, name: true } }, product: true, assignee: true },
        orderBy: { deadline: 'asc' },
      }),
    ]);
    return [
      ...products.map(productDeadlineProjection),
      ...extensions.map(extensionDeadlineProjection),
    ];
  }

  private listPersonalEvents(userId: string, from: Date, to: Date) {
    return this.prisma.personalCalendarEvent
      .findMany({
        where: { ownerId: userId, status: 'ACTIVE', startsAt: { lt: to }, endsAt: { gt: from } },
        orderBy: { startsAt: 'asc' },
      })
      .then((rows) =>
        rows.map<CalendarEventProjection>((row) => ({
          id: `personal:${row.id}`,
          layer: 'PERSONAL',
          title: row.title,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          isAllDay: row.isAllDay,
          description: row.notes,
          status: row.status,
          sourceType: 'PERSONAL_EVENT',
          sourceId: row.id,
          sourceHref: null,
          badge: 'Personal',
          projectName: null,
          ownerName: null,
        })),
      );
  }
}
