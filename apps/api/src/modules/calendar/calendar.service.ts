import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, type InputJsonValue } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { AuditService } from '../audit/audit.service';
import {
  fetchDeliveryDeadlineProjections,
  fetchMeetingCalendarProjections,
  fetchPersonalCalendarProjections,
} from './calendar-event-listing';
import {
  assertMeetingConflictsAcknowledgedOrThrow,
  classifyMeetingConflicts,
  findScheduledMeetingOverlaps,
} from './calendar-meeting-conflicts';
import { normalizeInternalParticipantIds } from './calendar-participants';
import { fetchMeetingVisibilityIds, isMeetingVisibleToViewer } from './calendar-meeting-visibility';
import type {
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
        ? fetchMeetingCalendarProjections(this.prisma, userId, accessScope, from, to)
        : [],
      layer === 'ALL' || layer === 'DELIVERY_DEADLINES'
        ? fetchDeliveryDeadlineProjections(this.prisma, userId, accessScope, from, to)
        : [],
      layer === 'ALL' || layer === 'PERSONAL'
        ? fetchPersonalCalendarProjections(this.prisma, userId, from, to)
        : [],
    ]);
    return groups.flat().sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  async getMeetingById(userId: string, accessScope: string, id: string) {
    const meeting = await this.prisma.calendarMeeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Calendar meeting not found.');
    const ids = await fetchMeetingVisibilityIds(this.prisma, userId);
    if (!isMeetingVisibleToViewer(meeting, userId, accessScope, ids)) {
      throw new ForbiddenException('Calendar meeting is not accessible.');
    }
    return meeting;
  }

  async getPersonalEventById(userId: string, id: string) {
    const row = await this.prisma.personalCalendarEvent.findFirst({
      where: { id, ownerId: userId },
    });
    if (!row) throw new ForbiddenException('Personal calendar event is not accessible.');
    return row;
  }

  async createMeeting(userId: string, body: CreateCalendarMeetingDto) {
    const title = body.title?.trim();
    if (!title) throw new BadRequestException('title is required.');
    const startsAt = parseDate(body.startsAt, new Date(NaN));
    const endsAt = parseDate(body.endsAt, new Date(NaN));
    assertDateOrder(startsAt, endsAt);

    const effectiveStatus = body.status ?? 'SCHEDULED';
    const internalParticipantIds = normalizeInternalParticipantIds(
      body.internalParticipantIds,
      userId,
    );
    const projectId = body.projectId ?? null;
    const dealId = body.dealId ?? null;
    const contactId = body.contactId ?? null;

    let conflictChanges: InputJsonValue | undefined;
    if (effectiveStatus === 'SCHEDULED') {
      const overlaps = await findScheduledMeetingOverlaps(this.prisma, {
        startsAt,
        endsAt,
        internalParticipantIds,
        projectId,
        dealId,
        contactId,
      });
      const conflicts = classifyMeetingConflicts(overlaps, {
        internalParticipantIds,
        projectId,
        dealId,
        contactId,
      });
      assertMeetingConflictsAcknowledgedOrThrow(conflicts, body.conflictOverrideReason);
      const reason = body.conflictOverrideReason?.trim();
      if (conflicts.length > 0 && reason) {
        conflictChanges = {
          conflictOverrideReason: reason,
          conflicts: conflicts.map((c) => ({
            code: c.code,
            meetingId: c.meetingId,
            meetingTitle: c.meetingTitle,
            detail: c.detail,
          })),
        };
      }
    }

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
        status: effectiveStatus,
        internalParticipantIds,
        externalParticipants: body.externalParticipants as InputJsonValue | undefined,
        projectId,
        productId: body.productId ?? null,
        dealId,
        contactId,
        createdById: userId,
      },
    });
    await this.audit.log({
      entityType: 'CalendarMeeting',
      entityId: meeting.id,
      action: 'calendar.meeting_created',
      userId,
      projectId: meeting.projectId ?? undefined,
      ...(conflictChanges ? { changes: conflictChanges } : {}),
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

    const mergedStatus = body.status !== undefined ? body.status : existing.status;
    const mergedInternalIds =
      body.internalParticipantIds !== undefined
        ? normalizeInternalParticipantIds(body.internalParticipantIds, existing.createdById)
        : existing.internalParticipantIds;

    let conflictChanges: InputJsonValue | undefined;
    if (mergedStatus === 'SCHEDULED') {
      const overlaps = await findScheduledMeetingOverlaps(this.prisma, {
        startsAt,
        endsAt,
        internalParticipantIds: mergedInternalIds,
        projectId: existing.projectId,
        dealId: existing.dealId,
        contactId: existing.contactId,
        excludeMeetingId: id,
      });
      const conflicts = classifyMeetingConflicts(overlaps, {
        internalParticipantIds: mergedInternalIds,
        projectId: existing.projectId,
        dealId: existing.dealId,
        contactId: existing.contactId,
      });
      assertMeetingConflictsAcknowledgedOrThrow(conflicts, body.conflictOverrideReason);
      const reason = body.conflictOverrideReason?.trim();
      if (conflicts.length > 0 && reason) {
        conflictChanges = {
          conflictOverrideReason: reason,
          conflicts: conflicts.map((c) => ({
            code: c.code,
            meetingId: c.meetingId,
            meetingTitle: c.meetingTitle,
            detail: c.detail,
          })),
        };
      }
    }

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
          internalParticipantIds: mergedInternalIds,
        }),
      },
    });
    await this.audit.log({
      entityType: 'CalendarMeeting',
      entityId: id,
      action: 'calendar.meeting_updated',
      userId,
      projectId: meeting.projectId ?? undefined,
      ...(conflictChanges ? { changes: conflictChanges } : {}),
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
    const ids = await fetchMeetingVisibilityIds(this.prisma, userId);
    if (isMeetingVisibleToViewer(meeting, userId, accessScope, ids)) return meeting;
    throw new ForbiddenException('Calendar meeting is not accessible.');
  }
}
