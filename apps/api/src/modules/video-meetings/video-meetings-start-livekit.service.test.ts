import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsService } from './video-meetings.service';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';

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
    VIDEO_MEETINGS_EDIT: 'ALL',
  },
};

function meetingRow() {
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
  };
}

describe('VideoMeetingsService start LiveKit ordering', () => {
  let service: VideoMeetingsService;
  let prisma: MockPrisma;
  let livekit: {
    isConfigured: ReturnType<typeof vi.fn>;
    ensureRoom: ReturnType<typeof vi.fn>;
    closeRoom: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    livekit = {
      isConfigured: vi.fn().mockReturnValue(true),
      ensureRoom: vi.fn().mockResolvedValue(undefined),
      closeRoom: vi.fn().mockResolvedValue(undefined),
    };
    service = new VideoMeetingsService(
      prisma as never,
      livekit as unknown as VideoMeetingsLivekitService,
      { stopIfRecordingOnMeetingEnd: vi.fn(), getActiveStatus: vi.fn() } as never,
      {
        resolveCalendarMeetingIdForCreate: vi.fn(),
        maybeCancelLinkedCalendar: vi.fn(),
      } as never,
    );
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
  });

  it('creates the LiveKit room before persisting the session', async () => {
    const calls: string[] = [];
    livekit.ensureRoom.mockImplementation(async () => {
      calls.push('ensure');
    });
    prisma.videoMeetingSession.create = vi.fn().mockResolvedValue({ id: 'sess-1' });
    prisma.videoMeeting.update = vi.fn().mockResolvedValue({
      ...meetingRow(),
      status: VideoMeetingStatus.ACTIVE,
    });
    prisma.$transaction = vi.fn().mockImplementation(async (fn: (tx: MockPrisma) => unknown) => {
      calls.push('persist');
      return fn(prisma);
    });

    await service.start(HOST, meetingRow().id);

    expect(calls).toEqual(['ensure', 'persist']);
    expect(livekit.closeRoom).not.toHaveBeenCalled();
  });

  it('does not persist a session when LiveKit rejects the room', async () => {
    livekit.ensureRoom.mockRejectedValue(
      new ServiceUnavailableException('LiveKit is not available'),
    );
    prisma.$transaction = vi.fn();

    await expect(service.start(HOST, meetingRow().id)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(livekit.closeRoom).not.toHaveBeenCalled();
  });

  it('closes the LiveKit room when persisting the session fails', async () => {
    prisma.$transaction = vi.fn().mockRejectedValue(new Error('db down'));

    await expect(service.start(HOST, meetingRow().id)).rejects.toThrow('db down');
    expect(livekit.closeRoom).toHaveBeenCalledWith(expect.stringMatching(/^vm_/));
  });
});
