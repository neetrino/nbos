import { describe, expect, it, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
  VideoMeetingStatus,
} from '@nbos/database';
import { digestVideoMeetingInviteToken } from '@nbos/shared';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';
import type { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import type { VideoMeetingsLivekitService } from './video-meetings-livekit.service';

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

describe('VideoMeetingsAdmissionService', () => {
  let service: VideoMeetingsAdmissionService;
  let prisma: MockPrisma;
  let invites: {
    findAdmissibleBySecret: ReturnType<typeof vi.fn>;
  };
  let livekit: {
    isConfigured: ReturnType<typeof vi.fn>;
    mintJoinToken: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    invites = { findAdmissibleBySecret: vi.fn() };
    livekit = {
      isConfigured: vi.fn().mockReturnValue(true),
      mintJoinToken: vi.fn().mockResolvedValue({
        livekitUrl: 'ws://127.0.0.1:7880',
        token: 'jwt.guest.token',
        roomName: 'vm_room',
      }),
    };
    service = new VideoMeetingsAdmissionService(
      prisma as never,
      invites as unknown as VideoMeetingsInvitesService,
      livekit as unknown as VideoMeetingsLivekitService,
    );
  });

  it('unadmitted guest does not receive a JWT', async () => {
    invites.findAdmissibleBySecret.mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
      tokenDigest: digestVideoMeetingInviteToken('tok'),
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prisma.videoMeetingParticipant.findUnique = vi.fn().mockResolvedValue({
      id: 'p-guest',
      displayName: 'Guest',
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      kind: VideoMeetingParticipantKind.GUEST,
      employeeId: null,
    });
    await expect(service.guestToken('tok')).rejects.toBeInstanceOf(ForbiddenException);
    expect(livekit.mintJoinToken).not.toHaveBeenCalled();
  });

  it('admitted guest receives least-privilege join payload without CRM fields', async () => {
    invites.findAdmissibleBySecret.mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
      tokenDigest: 'd',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    prisma.videoMeetingParticipant.findUnique = vi.fn().mockResolvedValue({
      id: 'p-guest',
      displayName: 'Guest Name',
      admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
      kind: VideoMeetingParticipantKind.GUEST,
      employeeId: null,
    });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 's1',
      livekitRoomName: 'vm_room',
      endedAt: null,
    });
    const result = await service.guestToken('tok');
    expect(result).toEqual({
      admissionState: 'ADMITTED',
      livekitUrl: 'ws://127.0.0.1:7880',
      token: 'jwt.guest.token',
      roomName: 'vm_room',
      participantId: 'p-guest',
      displayName: 'Guest Name',
    });
    assertSafeGuestPayload(result);
    expect(livekit.mintJoinToken).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'guest', participantId: 'p-guest' }),
    );
  });

  it('prejoin creates waiting guest with null employeeId and no token', async () => {
    invites.findAdmissibleBySecret.mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
    });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 's1',
      livekitRoomName: 'vm_room',
      endedAt: null,
    });
    prisma.videoMeetingParticipant.findUnique = vi.fn().mockResolvedValue(null);
    prisma.videoMeetingParticipant.create = vi.fn().mockResolvedValue({
      id: 'p-new',
      displayName: 'Ada Guest',
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
    });
    const result = await service.guestPrejoin('invite-secret', 'Ada Guest');
    expect(result.admissionState).toBe('WAITING');
    expect(result.participantId).toBe('p-new');
    expect(result).not.toHaveProperty('token');
    assertSafeGuestPayload(result);
    expect(prisma.videoMeetingParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: VideoMeetingParticipantKind.GUEST,
          employeeId: null,
          inviteId: 'inv-1',
          admissionStatus: VideoMeetingAdmissionStatus.WAITING,
        }),
      }),
    );
  });

  it('employee token reuses the same participant id on reconnect', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      status: VideoMeetingStatus.ACTIVE,
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      participants: [
        {
          id: 'p-emp-stable',
          admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
          employeeId: HOST.id,
        },
      ],
    });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 's1',
      livekitRoomName: 'vm_room',
      endedAt: null,
    });
    livekit.mintJoinToken.mockResolvedValue({
      livekitUrl: 'ws://127.0.0.1:7880',
      token: 'jwt.host.token',
      roomName: 'vm_room',
    });
    const first = await service.employeeToken(HOST, 'm1');
    const second = await service.employeeToken(HOST, 'm1');
    expect(first.participantId).toBe('p-emp-stable');
    expect(second.participantId).toBe('p-emp-stable');
    expect(livekit.mintJoinToken).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'host', participantId: 'p-emp-stable' }),
    );
  });

  it('revoked invite cannot prejoin', async () => {
    invites.findAdmissibleBySecret.mockResolvedValue(null);
    await expect(service.guestPrejoin('bad', 'Name')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('guest fixture has no entity-link / employee id fields', () => {
    const fixture = {
      admissionState: 'ADMITTED' as const,
      livekitUrl: 'ws://127.0.0.1:7880',
      token: 't',
      roomName: 'vm_room',
      participantId: 'p1',
      displayName: 'Guest',
    };
    expect(() => assertSafeGuestPayload(fixture)).not.toThrow();
    expect(() =>
      assertSafeGuestPayload({ ...fixture, entityLinks: [], hostEmployeeId: 'x' }),
    ).toThrow(/Unsafe guest/);
  });
});
