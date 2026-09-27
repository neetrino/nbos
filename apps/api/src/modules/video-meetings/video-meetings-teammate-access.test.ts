import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { VideoMeetingAdmissionStatus, VideoMeetingParticipantKind } from '@nbos/database';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { requireMeetingTeammate } from './video-meetings-teammate-access';

const MEETING_ID = '11111111-1111-4111-8111-111111111111';

describe('requireMeetingTeammate', () => {
  function prismaWith(participant: { id: string } | null) {
    const prisma = createMockPrisma() as MockPrisma;
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({ id: MEETING_ID });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 'sess-1',
      livekitRoomName: 'vm_room',
    });
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue(participant);
    return prisma;
  }

  it('requires an admitted employee of the open session', async () => {
    const prisma = prismaWith({ id: 'p-1' });

    const access = await requireMeetingTeammate(prisma as never, MEETING_ID, 'emp-1');

    expect(access.participantId).toBe('p-1');
    expect(prisma.videoMeetingParticipant.findFirst).toHaveBeenCalledWith({
      where: {
        meetingId: MEETING_ID,
        employeeId: 'emp-1',
        kind: VideoMeetingParticipantKind.EMPLOYEE,
        admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
        sessionId: 'sess-1',
        leftAt: null,
      },
      select: { id: true },
    });
  });

  it('rejects a colleague who is not admitted to this session', async () => {
    const prisma = prismaWith(null);

    await expect(
      requireMeetingTeammate(prisma as never, MEETING_ID, 'emp-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
