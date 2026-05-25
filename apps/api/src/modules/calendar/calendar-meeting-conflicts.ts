import { ConflictException } from '@nestjs/common';
import type { Prisma, PrismaClient } from '@nbos/database';

export const CALENDAR_MEETING_CONFLICT_CODE = 'CALENDAR_MEETING_CONFLICT' as const;

export type CalendarMeetingConflictCode =
  | 'PARTICIPANT_OVERLAP'
  | 'PROJECT_OVERLAP'
  | 'DEAL_OVERLAP'
  | 'CONTACT_OVERLAP';

export interface CalendarMeetingConflict {
  code: CalendarMeetingConflictCode;
  meetingId: string;
  meetingTitle: string;
  detail: string;
}

export type CalendarMeetingOverlapRow = {
  id: string;
  title: string;
  internalParticipantIds: string[];
  projectId: string | null;
  dealId: string | null;
  contactId: string | null;
};

export function classifyMeetingConflicts(
  overlapping: CalendarMeetingOverlapRow[],
  input: {
    internalParticipantIds: string[];
    projectId: string | null;
    dealId: string | null;
    contactId: string | null;
  },
): CalendarMeetingConflict[] {
  const participantSet = new Set(input.internalParticipantIds);
  const out: CalendarMeetingConflict[] = [];
  const seen = new Set<string>();

  const push = (c: CalendarMeetingConflict) => {
    const key = `${c.code}:${c.meetingId}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };

  for (const row of overlapping) {
    const participantOverlap = row.internalParticipantIds.some((id) => participantSet.has(id));
    if (participantOverlap) {
      push({
        code: 'PARTICIPANT_OVERLAP',
        meetingId: row.id,
        meetingTitle: row.title,
        detail:
          'An internal participant already has another scheduled meeting overlapping this time.',
      });
    }
    if (input.projectId && row.projectId === input.projectId) {
      push({
        code: 'PROJECT_OVERLAP',
        meetingId: row.id,
        meetingTitle: row.title,
        detail: 'This project already has another scheduled meeting overlapping this time.',
      });
    }
    if (input.dealId && row.dealId === input.dealId) {
      push({
        code: 'DEAL_OVERLAP',
        meetingId: row.id,
        meetingTitle: row.title,
        detail: 'This deal already has another scheduled meeting overlapping this time.',
      });
    }
    if (input.contactId && row.contactId === input.contactId) {
      push({
        code: 'CONTACT_OVERLAP',
        meetingId: row.id,
        meetingTitle: row.title,
        detail: 'This contact already has another scheduled meeting overlapping this time.',
      });
    }
  }

  return out;
}

export async function findScheduledMeetingOverlaps(
  prisma: Pick<InstanceType<typeof PrismaClient>, 'calendarMeeting'>,
  input: {
    startsAt: Date;
    endsAt: Date;
    internalParticipantIds: string[];
    projectId: string | null;
    dealId: string | null;
    contactId: string | null;
    excludeMeetingId?: string;
  },
): Promise<CalendarMeetingOverlapRow[]> {
  const orFilters: Prisma.CalendarMeetingWhereInput[] = [
    { internalParticipantIds: { hasSome: input.internalParticipantIds } },
  ];
  if (input.projectId) orFilters.push({ projectId: input.projectId });
  if (input.dealId) orFilters.push({ dealId: input.dealId });
  if (input.contactId) orFilters.push({ contactId: input.contactId });

  const rows = await prisma.calendarMeeting.findMany({
    where: {
      status: 'SCHEDULED',
      ...(input.excludeMeetingId ? { id: { not: input.excludeMeetingId } } : {}),
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
      OR: orFilters,
    },
    select: {
      id: true,
      title: true,
      internalParticipantIds: true,
      projectId: true,
      dealId: true,
      contactId: true,
    },
  });

  return rows;
}

export function assertMeetingConflictsAcknowledgedOrThrow(
  conflicts: CalendarMeetingConflict[],
  conflictOverrideReason: string | null | undefined,
): void {
  if (conflicts.length === 0) return;
  const trimmed = conflictOverrideReason?.trim();
  if (trimmed) return;
  throw new ConflictException({
    statusCode: 409,
    message: 'Meeting overlaps with existing scheduled meetings.',
    code: CALENDAR_MEETING_CONFLICT_CODE,
    conflicts,
  });
}
