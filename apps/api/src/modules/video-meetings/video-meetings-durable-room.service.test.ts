import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { VideoMeetingsService } from './video-meetings.service';

const MEETING_ID = '11111111-1111-4111-8111-111111111111';

const HOST: CurrentUserPayload = {
  id: 'emp-host',
  email: 'host@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Host',
  lastName: 'User',
  permissions: { VIDEO_MEETINGS_VIEW: 'ALL', VIDEO_MEETINGS_EDIT: 'ALL' },
};

function meetingRow(status: VideoMeetingStatus) {
  const now = new Date('2026-09-27T10:00:00.000Z');
  return {
    id: MEETING_ID,
    title: 'Client room',
    status,
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
    recordings: [],
  };
}

describe('Video meeting durable room lifecycle', () => {
  let prisma: MockPrisma;
  let service: VideoMeetingsService;

  beforeEach(() => {
    prisma = createMockPrisma();
    prisma.$transaction = vi
      .fn()
      .mockImplementation(async (fn: (tx: MockPrisma) => unknown) => fn(prisma));
    const livekit = { isConfigured: vi.fn().mockReturnValue(false), ensureRoom: vi.fn() };
    service = new VideoMeetingsService(
      prisma as never,
      livekit as unknown as VideoMeetingsLivekitService,
      { stopIfRecordingOnMeetingEnd: vi.fn().mockResolvedValue(undefined) } as never,
      { maybeCancelLinkedCalendar: vi.fn().mockResolvedValue(undefined) } as never,
    );
  });

  it.each([VideoMeetingStatus.IDLE, VideoMeetingStatus.ENDED])(
    'start from %s opens a new session with a new room name',
    async (status) => {
      prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow(status));
      prisma.videoMeetingSession.create = vi.fn().mockResolvedValue({ id: 'sess-2' });
      prisma.videoMeeting.update = vi.fn().mockResolvedValue(meetingRow(VideoMeetingStatus.ACTIVE));

      const card = await service.start(HOST, MEETING_ID);

      expect(card.status).toBe(VideoMeetingStatus.ACTIVE);
      expect(prisma.videoMeetingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          meetingId: MEETING_ID,
          livekitRoomName: expect.stringMatching(/^vm_/),
        }),
      });
    },
  );

  it('rejects start while a session is already open', async () => {
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue(meetingRow(VideoMeetingStatus.ACTIVE));

    await expect(service.start(HOST, MEETING_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.videoMeetingSession.create).not.toHaveBeenCalled();
  });

  it('end closes the open session and sets the room IDLE (never ENDED)', async () => {
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue(meetingRow(VideoMeetingStatus.ACTIVE));
    prisma.videoMeetingSession.updateMany = vi.fn().mockResolvedValue({ count: 1 });
    prisma.videoMeeting.update = vi.fn().mockResolvedValue(meetingRow(VideoMeetingStatus.IDLE));

    const card = await service.end(HOST, MEETING_ID);

    expect(prisma.videoMeetingSession.updateMany).toHaveBeenCalledWith({
      where: { meetingId: MEETING_ID, endedAt: null },
      data: { endedAt: expect.any(Date) },
    });
    expect(prisma.videoMeeting.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: VideoMeetingStatus.IDLE, endedAt: expect.any(Date) },
      }),
    );
    expect(card.status).toBe(VideoMeetingStatus.IDLE);
  });

  it('cancel stays limited to rooms that were never held', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow(VideoMeetingStatus.IDLE));

    await expect(service.cancel(HOST, MEETING_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.videoMeeting.update).not.toHaveBeenCalled();
  });

  it('guest invites can be created for an IDLE room but not a CANCELLED one', async () => {
    const invites = new VideoMeetingsInvitesService(prisma as never);
    prisma.videoMeetingInvite.create = vi.fn().mockResolvedValue({
      id: 'inv-1',
      meetingId: MEETING_ID,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const expiresAt = new Date(Date.now() + 60_000);

    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow(VideoMeetingStatus.IDLE));
    await expect(invites.create(HOST, MEETING_ID, expiresAt)).resolves.toMatchObject({
      id: 'inv-1',
    });

    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue(meetingRow(VideoMeetingStatus.CANCELLED));
    await expect(invites.create(HOST, MEETING_ID, expiresAt)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
