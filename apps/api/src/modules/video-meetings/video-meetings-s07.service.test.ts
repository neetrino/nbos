import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsService } from './video-meetings.service';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import type { VideoMeetingsCalendarLinkService } from './video-meetings-calendar-link.service';
import { noteCalendarLinkedReminderOwnership } from './video-meetings-calendar-reminders';

const HOST: CurrentUserPayload = {
  id: 'emp-host',
  email: 'host@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Host',
  lastName: 'User',
  permissions: {
    VIDEO_MEETINGS_VIEW: 'ALL',
    VIDEO_MEETINGS_ADD: 'ALL',
    VIDEO_MEETINGS_EDIT: 'ALL',
    CALENDAR_VIEW: 'ALL',
  },
};

function meetingRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-09-26T12:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Instant meeting',
    status: VideoMeetingStatus.CREATED,
    hostEmployeeId: HOST.id,
    ownerEmployeeId: HOST.id,
    scheduledStartsAt: null,
    scheduledEndsAt: null,
    endedAt: null,
    cancelledAt: null,
    calendarMeetingId: null,
    createdAt: now,
    updatedAt: now,
    sessions: [],
    entityLinks: [],
    participants: [],
    recordings: [],
    ...overrides,
  };
}

describe('VideoMeetingsService S07 calendar + ATS', () => {
  let service: VideoMeetingsService;
  let prisma: MockPrisma;
  let calendarLink: {
    resolveCalendarMeetingIdForCreate: ReturnType<typeof vi.fn>;
    maybeCancelLinkedCalendar: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    calendarLink = {
      resolveCalendarMeetingIdForCreate: vi.fn().mockResolvedValue(null),
      maybeCancelLinkedCalendar: vi.fn().mockResolvedValue(undefined),
    };
    const livekit = {
      isConfigured: vi.fn().mockReturnValue(false),
      ensureRoom: vi.fn(),
    };
    const recordings = {
      stopIfRecordingOnMeetingEnd: vi.fn(),
      getActiveStatus: vi.fn().mockResolvedValue(null),
    };
    service = new VideoMeetingsService(
      prisma as never,
      livekit as unknown as VideoMeetingsLivekitService,
      recordings as never,
      calendarLink as unknown as VideoMeetingsCalendarLinkService,
    );
  });

  it('standalone create keeps calendarMeetingId null when Calendar resolve returns null', async () => {
    calendarLink.resolveCalendarMeetingIdForCreate.mockResolvedValue(null);
    prisma.videoMeeting.create = vi.fn().mockResolvedValue(meetingRow());

    const card = await service.create(HOST, {});

    expect(calendarLink.resolveCalendarMeetingIdForCreate).toHaveBeenCalled();
    expect(prisma.videoMeeting.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ calendarMeetingId: null }),
      }),
    );
    expect(card.calendarMeetingId).toBeNull();
  });

  it('create succeeds with null calendar when Calendar bridge degrades after failure', async () => {
    // Bridge already swallowed Calendar throw and returned null.
    calendarLink.resolveCalendarMeetingIdForCreate.mockResolvedValue(null);
    prisma.videoMeeting.create = vi.fn().mockResolvedValue(meetingRow());

    const card = await service.create(HOST, { createCalendarMeeting: true });

    expect(card.calendarMeetingId).toBeNull();
    expect(prisma.atsCallEvent.create).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.update).not.toHaveBeenCalled();
  });

  it('stores linked calendarMeetingId when bridge returns an id', async () => {
    const calId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    calendarLink.resolveCalendarMeetingIdForCreate.mockResolvedValue(calId);
    prisma.videoMeeting.create = vi
      .fn()
      .mockResolvedValue(meetingRow({ calendarMeetingId: calId }));

    const card = await service.create(HOST, { calendarMeetingId: calId });

    expect(prisma.videoMeeting.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ calendarMeetingId: calId }),
      }),
    );
    expect(card.calendarMeetingId).toBe(calId);
  });

  it('create/start do not write AtsCallEvent (CALLS journal) rows', async () => {
    prisma.videoMeeting.create = vi.fn().mockResolvedValue(meetingRow());
    await service.create(HOST, {});
    expect(prisma.atsCallEvent.create).not.toHaveBeenCalled();

    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
    prisma.videoMeetingSession.create = vi.fn().mockResolvedValue({});
    prisma.videoMeeting.update = vi
      .fn()
      .mockResolvedValue(meetingRow({ status: VideoMeetingStatus.ACTIVE, sessions: [] }));
    prisma.$transaction = vi
      .fn()
      .mockImplementation(async (fn: (tx: MockPrisma) => unknown) => fn(prisma));

    await service.start(HOST, meetingRow().id);
    expect(prisma.atsCallEvent.create).not.toHaveBeenCalled();
    expect(prisma.atsCallEvent.update).not.toHaveBeenCalled();
  });

  it('cancel without confirm does not cascade Calendar cancel', async () => {
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue(meetingRow({ calendarMeetingId: 'cal-1' }));
    prisma.videoMeeting.update = vi
      .fn()
      .mockResolvedValue(meetingRow({ status: VideoMeetingStatus.CANCELLED }));

    await service.cancel(HOST, meetingRow().id, {});

    expect(calendarLink.maybeCancelLinkedCalendar).toHaveBeenCalledWith(HOST, 'cal-1', undefined);
  });
});

describe('VideoMeetingsCalendarLinkService', () => {
  it('returns null without calling Calendar when no calendar options', async () => {
    const createMeeting = vi.fn();
    const getMeetingById = vi.fn();
    const { VideoMeetingsCalendarLinkService } =
      await import('./video-meetings-calendar-link.service');
    const link = new VideoMeetingsCalendarLinkService(
      createMockPrisma() as never,
      { createMeeting, getMeetingById, updateMeeting: vi.fn() } as never,
    );
    const id = await link.resolveCalendarMeetingIdForCreate(HOST, {}, 'Title');
    expect(id).toBeNull();
    expect(createMeeting).not.toHaveBeenCalled();
    expect(getMeetingById).not.toHaveBeenCalled();
  });

  it('degrades to null when createCalendarMeeting throws', async () => {
    const { VideoMeetingsCalendarLinkService } =
      await import('./video-meetings-calendar-link.service');
    const link = new VideoMeetingsCalendarLinkService(
      createMockPrisma() as never,
      {
        createMeeting: vi.fn().mockRejectedValue(new Error('Calendar down')),
        getMeetingById: vi.fn(),
        updateMeeting: vi.fn(),
      } as never,
    );
    const id = await link.resolveCalendarMeetingIdForCreate(
      HOST,
      { createCalendarMeeting: true },
      'Title',
    );
    expect(id).toBeNull();
  });

  it('rejects both calendarMeetingId and createCalendarMeeting', async () => {
    const { VideoMeetingsCalendarLinkService } =
      await import('./video-meetings-calendar-link.service');
    const link = new VideoMeetingsCalendarLinkService(
      createMockPrisma() as never,
      { createMeeting: vi.fn(), getMeetingById: vi.fn(), updateMeeting: vi.fn() } as never,
    );
    await expect(
      link.resolveCalendarMeetingIdForCreate(
        HOST,
        { calendarMeetingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', createCalendarMeeting: true },
        'Title',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('propagates not-found for invalid existing calendarMeetingId', async () => {
    const { VideoMeetingsCalendarLinkService } =
      await import('./video-meetings-calendar-link.service');
    const link = new VideoMeetingsCalendarLinkService(
      createMockPrisma() as never,
      {
        createMeeting: vi.fn(),
        getMeetingById: vi.fn().mockRejectedValue(new NotFoundException('missing')),
        updateMeeting: vi.fn(),
      } as never,
    );
    await expect(
      link.resolveCalendarMeetingIdForCreate(
        HOST,
        { calendarMeetingId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
        'Title',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('calendar reminder ownership note', () => {
  it('is a documented no-op (no Calendar reminder job exists to invoke)', () => {
    expect(() => noteCalendarLinkedReminderOwnership(null)).not.toThrow();
    expect(() => noteCalendarLinkedReminderOwnership('cal-1')).not.toThrow();
  });
});
