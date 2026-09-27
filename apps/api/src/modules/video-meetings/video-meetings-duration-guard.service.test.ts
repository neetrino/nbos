import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsDurationGuardService } from './video-meetings-duration-guard.service';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import type { VideoMeetingsRecordingService } from './video-meetings-recording.service';

const TEAMMATE: CurrentUserPayload = {
  id: 'emp-1',
  email: 'a@nbos.test',
  role: 'employee',
  roleLevel: 1,
  departmentIds: [],
  firstName: 'Ani',
  lastName: 'User',
  permissions: {},
};

const MEETING_ID = '11111111-1111-4111-8111-111111111111';
const STARTED = new Date('2026-09-27T10:00:00.000Z');

function sessionAt(continuedThrough: Date | null) {
  return {
    id: 'sess-1',
    meetingId: MEETING_ID,
    startedAt: STARTED,
    durationContinuedThrough: continuedThrough,
  };
}

describe('VideoMeetingsDurationGuardService', () => {
  function build() {
    const prisma = createMockPrisma() as MockPrisma;
    prisma.$transaction = vi
      .fn()
      .mockImplementation(async (fn: (tx: MockPrisma) => unknown) => fn(prisma));
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue({ id: MEETING_ID, status: VideoMeetingStatus.ACTIVE });
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue({ id: 'p-1' });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue(sessionAt(null));
    prisma.videoMeetingSession.update = vi.fn().mockResolvedValue(sessionAt(new Date()));
    const recordings = {
      stopIfRecordingOnMeetingEnd: vi.fn().mockResolvedValue(undefined),
    } as unknown as VideoMeetingsRecordingService;
    const livekit = {
      isConfigured: () => false,
      closeRoom: vi.fn(),
    } as unknown as VideoMeetingsLivekitService;
    const service = new VideoMeetingsDurationGuardService(prisma as never, livekit, recordings);
    return { prisma, recordings, service };
  }

  it('rejects continue before the warning window', async () => {
    const { service } = build();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STARTED.getTime() + 20 * 60 * 1000));

    await expect(service.continue(TEAMMATE, MEETING_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    vi.useRealTimers();
  });

  it('records who continued during the warning', async () => {
    const { prisma, service } = build();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(STARTED.getTime() + 50 * 60 * 1000));

    const state = await service.continue(TEAMMATE, MEETING_ID);

    expect(state.phase).toBe('quiet');
    expect(prisma.videoMeetingSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ durationContinuedByEmployeeId: TEAMMATE.id }),
      }),
    );
    vi.useRealTimers();
  });

  it('ends the meeting and stops recording when the checkpoint is due', async () => {
    const { prisma, recordings, service } = build();
    prisma.videoMeeting.updateMany = vi.fn().mockResolvedValue({ count: 1 });
    prisma.videoMeetingSession.findMany = vi.fn().mockResolvedValue([sessionAt(null)]);

    const ended = await service.sweepDue(new Date(STARTED.getTime() + 60 * 60 * 1000));

    expect(ended).toBe(1);
    expect(recordings.stopIfRecordingOnMeetingEnd).toHaveBeenCalledWith(MEETING_ID);
    expect(prisma.videoMeeting.updateMany).toHaveBeenCalled();
  });

  it('keeps sweeping when one meeting fails to end', async () => {
    const { prisma, recordings, service } = build();
    const secondId = '22222222-2222-4222-8222-222222222222';
    prisma.videoMeeting.updateMany = vi.fn().mockResolvedValue({ count: 1 });
    prisma.videoMeetingSession.findMany = vi
      .fn()
      .mockResolvedValue([
        sessionAt(null),
        { ...sessionAt(null), id: 'sess-2', meetingId: secondId },
      ]);
    recordings.stopIfRecordingOnMeetingEnd = vi
      .fn()
      .mockRejectedValueOnce(new Error('egress down'))
      .mockResolvedValueOnce(undefined);

    const ended = await service.sweepDue(new Date(STARTED.getTime() + 60 * 60 * 1000));

    expect(ended).toBe(1);
    expect(recordings.stopIfRecordingOnMeetingEnd).toHaveBeenCalledWith(secondId);
  });

  it('does not end a meeting that was continued before the sweep finishes', async () => {
    const { prisma, recordings, service } = build();
    const continued = new Date(STARTED.getTime() + 60 * 60 * 1000);
    prisma.videoMeetingSession.findMany = vi.fn().mockResolvedValue([sessionAt(null)]);
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue(sessionAt(continued));

    const ended = await service.sweepDue(continued);

    expect(ended).toBe(0);
    expect(recordings.stopIfRecordingOnMeetingEnd).not.toHaveBeenCalled();
  });
});
