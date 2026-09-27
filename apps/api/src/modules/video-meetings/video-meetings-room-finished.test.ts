import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoMeetingStatus } from '@nbos/database';
import { closeMeetingAfterLiveKitRoomFinished } from './video-meetings-room-finished';

const MEETING_ID = '11111111-1111-4111-8111-111111111111';
const ROOM = 'vm_test_room';

describe('closeMeetingAfterLiveKitRoomFinished', () => {
  const stopIfRecordingOnMeetingEnd = vi.fn().mockResolvedValue(undefined);
  const updateMeeting = vi.fn();
  const updateSession = vi.fn().mockResolvedValue({ count: 1 });
  const prisma = {
    videoMeetingSession: {
      findFirst: vi.fn(),
      updateMany: updateSession,
    },
    videoMeeting: {
      findUnique: vi.fn(),
      updateMany: updateMeeting,
    },
    $transaction: vi.fn(async (fn: (tx: typeof prisma) => Promise<boolean>) => fn(prisma)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    stopIfRecordingOnMeetingEnd.mockResolvedValue(undefined);
    updateSession.mockResolvedValue({ count: 1 });
  });

  it('finalizes the recording and marks the meeting idle', async () => {
    prisma.videoMeetingSession.findFirst.mockResolvedValue({ meetingId: MEETING_ID });
    prisma.videoMeeting.findUnique.mockResolvedValue({ status: VideoMeetingStatus.ACTIVE });
    updateMeeting.mockResolvedValue({ count: 1 });

    const closed = await closeMeetingAfterLiveKitRoomFinished(
      prisma as never,
      { stopIfRecordingOnMeetingEnd },
      ROOM,
    );

    expect(closed).toBe(true);
    expect(stopIfRecordingOnMeetingEnd).toHaveBeenCalledWith(MEETING_ID);
    expect(updateMeeting).toHaveBeenCalledWith({
      where: { id: MEETING_ID, status: VideoMeetingStatus.ACTIVE },
      data: { status: VideoMeetingStatus.IDLE, endedAt: expect.any(Date) },
    });
    expect(updateSession).toHaveBeenCalledWith({
      where: { meetingId: MEETING_ID, endedAt: null },
      data: { endedAt: expect.any(Date) },
    });
  });

  it('does nothing when the host already ended the session', async () => {
    prisma.videoMeetingSession.findFirst.mockResolvedValue(null);

    const closed = await closeMeetingAfterLiveKitRoomFinished(
      prisma as never,
      { stopIfRecordingOnMeetingEnd },
      ROOM,
    );

    expect(closed).toBe(false);
    expect(stopIfRecordingOnMeetingEnd).not.toHaveBeenCalled();
  });
});
