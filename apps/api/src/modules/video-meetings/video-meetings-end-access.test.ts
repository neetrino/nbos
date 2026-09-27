import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { authorizeMeetingEnd } from './video-meetings-end-access';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';

const MEETING_ID = '11111111-1111-4111-8111-111111111111';
const HOST = 'emp-host';
const TEAMMATE = 'emp-2';

function livekit(identities: string[], configured = true) {
  return {
    isConfigured: () => configured,
    listParticipantIdentities: vi.fn().mockResolvedValue(identities),
  } as unknown as VideoMeetingsLivekitService;
}

describe('authorizeMeetingEnd', () => {
  function prismaFor(participant: { id: string } | null, others = 0) {
    const prisma = createMockPrisma() as MockPrisma;
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      hostEmployeeId: HOST,
      ownerEmployeeId: HOST,
    });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 'sess-1',
      livekitRoomName: 'vm_room',
    });
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue(participant);
    prisma.videoMeetingParticipant.count = vi.fn().mockResolvedValue(others);
    return prisma;
  }

  it('lets only the host end when LiveKit is not configured', async () => {
    const prisma = prismaFor(null);

    await expect(
      authorizeMeetingEnd(prisma as never, livekit([], false), MEETING_ID, TEAMMATE),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const access = await authorizeMeetingEnd(prisma as never, livekit([], false), MEETING_ID, HOST);
    expect(access.mayCancelCalendar).toBe(true);
  });

  it('rejects a teammate who is not connected when the room is empty', async () => {
    const prisma = prismaFor(null);

    await expect(
      authorizeMeetingEnd(prisma as never, livekit([]), MEETING_ID, TEAMMATE),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets the host end an empty room from outside the call', async () => {
    const prisma = prismaFor(null);

    const access = await authorizeMeetingEnd(prisma as never, livekit([]), MEETING_ID, HOST);

    expect(access.mayCancelCalendar).toBe(true);
  });

  it('rejects the end while another teammate is in the room', async () => {
    const prisma = prismaFor({ id: 'p-1' }, 1);

    await expect(
      authorizeMeetingEnd(prisma as never, livekit(['p-1', 'p-2']), MEETING_ID, TEAMMATE),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets the last connected teammate end', async () => {
    const prisma = prismaFor({ id: 'p-2' });

    const access = await authorizeMeetingEnd(
      prisma as never,
      livekit(['p-2']),
      MEETING_ID,
      TEAMMATE,
    );

    expect(access.mayCancelCalendar).toBe(false);
  });
});
