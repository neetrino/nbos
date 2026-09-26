import { describe, expect, it, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { digestVideoMeetingInviteToken, isInviteAdmissible } from '@nbos/shared';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';

const HOST: CurrentUserPayload = {
  id: 'emp-host',
  email: 'host@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Host',
  lastName: 'User',
  permissions: { VIDEO_MEETINGS_EDIT: 'ALL' },
};

describe('VideoMeetingsInvitesService', () => {
  let service: VideoMeetingsInvitesService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new VideoMeetingsInvitesService(prisma as never);
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      status: 'ACTIVE',
    });
  });

  it('returns raw token once and persists digest only', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.videoMeetingInvite.create = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'inv-1',
        meetingId: 'm1',
        tokenDigest: data.tokenDigest,
        expiresAt: data.expiresAt,
        revokedAt: null,
        createdByEmployeeId: HOST.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const result = await service.create(HOST, 'm1', expiresAt);

    expect(result.token.length).toBeGreaterThan(16);
    expect(result).not.toHaveProperty('tokenDigest');
    expect(prisma.videoMeetingInvite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenDigest: digestVideoMeetingInviteToken(result.token),
          expiresAt,
        }),
      }),
    );
    const stored = (prisma.videoMeetingInvite.create as ReturnType<typeof vi.fn>).mock.calls[0]![0]
      .data as { tokenDigest: string; token?: string };
    expect(stored.token).toBeUndefined();
    expect(
      isInviteAdmissible({
        tokenDigest: stored.tokenDigest,
        tokenPlaintext: null,
        expiresAt,
        revokedAt: null,
      }),
    ).toBe(true);
  });

  it('revoked invite is not admissible for minting', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    prisma.videoMeetingInvite.findUnique = vi.fn().mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
      tokenDigest: digestVideoMeetingInviteToken('secret-token-value-xx'),
      expiresAt,
      revokedAt: new Date(),
      createdByEmployeeId: HOST.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const found = await service.findAdmissibleBySecret('secret-token-value-xx');
    expect(found).toBeNull();
    expect(
      isInviteAdmissible({
        tokenDigest: 'x',
        tokenPlaintext: null,
        expiresAt,
        revokedAt: new Date(),
      }),
    ).toBe(false);
  });

  it('expired invite is not admissible', async () => {
    const expiresAt = new Date(Date.now() - 60_000);
    prisma.videoMeetingInvite.findUnique = vi.fn().mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
      tokenDigest: digestVideoMeetingInviteToken('secret-token-value-yy'),
      expiresAt,
      revokedAt: null,
      createdByEmployeeId: HOST.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(await service.findAdmissibleBySecret('secret-token-value-yy')).toBeNull();
  });

  it('non-host cannot create invites', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      hostEmployeeId: 'other',
      ownerEmployeeId: 'other',
      status: 'ACTIVE',
    });
    await expect(service.create(HOST, 'm1', new Date(Date.now() + 60_000))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects past expiry on create', async () => {
    await expect(service.create(HOST, 'm1', new Date(Date.now() - 1000))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('revoke sets revokedAt', async () => {
    prisma.videoMeetingInvite.findFirst = vi.fn().mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      createdAt: new Date(),
    });
    prisma.videoMeetingInvite.update = vi.fn().mockResolvedValue({
      id: 'inv-1',
      meetingId: 'm1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date('2026-09-26T12:00:00.000Z'),
      createdAt: new Date(),
    });
    const result = await service.revoke(HOST, 'm1', 'inv-1');
    expect(result.revokedAt).toBe('2026-09-26T12:00:00.000Z');
  });

  it('missing meeting yields 404', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(null);
    await expect(service.create(HOST, 'm1', new Date(Date.now() + 60_000))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
