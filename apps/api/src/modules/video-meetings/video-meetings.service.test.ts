import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VideoMeetingStatus } from '@nbos/database';
import { entityLinkGrantsVideoMeetingsAccess } from '@nbos/shared';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsService } from './video-meetings.service';
import { assertSafeVideoMeetingPayload } from './video-meetings.serializer';
import { VideoMeetingEntityLinkTypeDto } from './dto/video-meetings.dto';
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
    VIDEO_MEETINGS_ADD: 'ALL',
    VIDEO_MEETINGS_EDIT: 'ALL',
    CRM_DEALS_VIEW: 'ALL',
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
    ...overrides,
  };
}

describe('VideoMeetingsService', () => {
  let service: VideoMeetingsService;
  let prisma: MockPrisma;
  let livekit: { isConfigured: ReturnType<typeof vi.fn>; ensureRoom: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    livekit = {
      isConfigured: vi.fn().mockReturnValue(false),
      ensureRoom: vi.fn().mockResolvedValue(undefined),
    };
    service = new VideoMeetingsService(
      prisma as never,
      livekit as unknown as VideoMeetingsLivekitService,
    );
  });

  it('creates an unlinked instant meeting with caller as host and owner', async () => {
    const row = meetingRow();
    prisma.videoMeeting.create = vi.fn().mockResolvedValue(row);

    const card = await service.create(HOST, {});

    expect(prisma.videoMeeting.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hostEmployeeId: HOST.id,
          ownerEmployeeId: HOST.id,
          calendarMeetingId: null,
          status: VideoMeetingStatus.CREATED,
        }),
      }),
    );
    expect(card.calendarMeetingId).toBeNull();
    expect(card.entityLinks).toEqual([]);
    assertSafeVideoMeetingPayload(card);
  });

  it('start creates a session with opaque room name; skips LiveKit when not configured', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
    prisma.videoMeetingSession.create = vi.fn().mockResolvedValue({
      id: 'sess-1',
      livekitRoomName: 'vm_opaque',
      startedAt: new Date(),
      endedAt: null,
      createdAt: new Date(),
    });
    prisma.videoMeeting.update = vi.fn().mockResolvedValue(
      meetingRow({
        status: VideoMeetingStatus.ACTIVE,
        sessions: [
          {
            id: 'sess-1',
            livekitRoomName: 'vm_opaque',
            startedAt: new Date(),
            endedAt: null,
            createdAt: new Date(),
          },
        ],
      }),
    );
    prisma.$transaction = vi
      .fn()
      .mockImplementation(async (fn: (tx: MockPrisma) => unknown) => fn(prisma));

    const card = await service.start(HOST, meetingRow().id);

    expect(card.status).toBe(VideoMeetingStatus.ACTIVE);
    expect(livekit.ensureRoom).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('start ensures LiveKit room when configured', async () => {
    livekit.isConfigured.mockReturnValue(true);
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
    prisma.videoMeetingSession.create = vi.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'sess-1',
        livekitRoomName: data.livekitRoomName,
        startedAt: new Date(),
        endedAt: null,
        createdAt: new Date(),
      }),
    );
    prisma.videoMeeting.update = vi.fn().mockImplementation(() =>
      Promise.resolve(
        meetingRow({
          status: VideoMeetingStatus.ACTIVE,
          sessions: [
            {
              id: 'sess-1',
              livekitRoomName: 'vm_test',
              startedAt: new Date(),
              endedAt: null,
              createdAt: new Date(),
            },
          ],
        }),
      ),
    );
    prisma.$transaction = vi
      .fn()
      .mockImplementation(async (fn: (tx: MockPrisma) => unknown) => fn(prisma));

    await service.start(HOST, meetingRow().id);
    expect(livekit.ensureRoom).toHaveBeenCalledWith(expect.stringMatching(/^vm_/));
  });

  it('attach rejects when caller lacks target-object authorization', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
    const noDealPerms: CurrentUserPayload = {
      ...HOST,
      permissions: {
        VIDEO_MEETINGS_VIEW: 'ALL',
        VIDEO_MEETINGS_EDIT: 'ALL',
      },
    };

    await expect(
      service.attachEntityLink(noDealPerms, meetingRow().id, {
        entityType: VideoMeetingEntityLinkTypeDto.DEAL,
        entityId: 'deal-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.videoMeetingEntityLink.create).not.toHaveBeenCalled();
  });

  it('attach rejects unknown entity id', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
    prisma.deal.findUnique = vi.fn().mockResolvedValue(null);

    await expect(
      service.attachEntityLink(HOST, meetingRow().id, {
        entityType: VideoMeetingEntityLinkTypeDto.DEAL,
        entityId: 'missing-deal',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('attach and detach succeed when entity is authorized', async () => {
    const linkId = '22222222-2222-4222-8222-222222222222';
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValueOnce(meetingRow())
      .mockResolvedValueOnce(
        meetingRow({
          entityLinks: [
            {
              id: linkId,
              entityType: 'DEAL',
              entityId: 'deal-1',
              createdAt: new Date(),
              updatedAt: new Date(),
              meetingId: meetingRow().id,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(meetingRow())
      .mockResolvedValueOnce(meetingRow());
    prisma.deal.findUnique = vi.fn().mockResolvedValue({ id: 'deal-1' });
    prisma.videoMeetingEntityLink.create = vi.fn().mockResolvedValue({ id: linkId });
    prisma.videoMeetingEntityLink.findFirst = vi.fn().mockResolvedValue({
      id: linkId,
      meetingId: meetingRow().id,
    });
    prisma.videoMeetingEntityLink.delete = vi.fn().mockResolvedValue({ id: linkId });

    const attached = await service.attachEntityLink(HOST, meetingRow().id, {
      entityType: VideoMeetingEntityLinkTypeDto.DEAL,
      entityId: 'deal-1',
    });
    expect(attached.entityLinks).toHaveLength(1);
    expect(entityLinkGrantsVideoMeetingsAccess(attached.entityLinks as never, {})).toBe(false);

    const detached = await service.detachEntityLink(HOST, meetingRow().id, linkId);
    expect(prisma.videoMeetingEntityLink.delete).toHaveBeenCalled();
    expect(detached.entityLinks).toEqual([]);
  });

  it('does not leak other employees meetings on getCard', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(
      meetingRow({
        hostEmployeeId: 'other',
        ownerEmployeeId: 'other',
        participants: [],
      }),
    );

    await expect(service.getCard(HOST, meetingRow().id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects start on cancelled meeting', async () => {
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue(meetingRow({ status: VideoMeetingStatus.CANCELLED }));

    await expect(service.start(HOST, meetingRow().id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('serialized payloads never include playback or invite secrets', () => {
    const card = {
      id: 'm1',
      title: 't',
      status: VideoMeetingStatus.CREATED,
      hostEmployeeId: 'e',
      ownerEmployeeId: 'e',
      scheduledStartsAt: null,
      scheduledEndsAt: null,
      endedAt: null,
      cancelledAt: null,
      calendarMeetingId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessions: [],
      entityLinks: [],
    };
    expect(() => assertSafeVideoMeetingPayload(card)).not.toThrow();
    expect(() => assertSafeVideoMeetingPayload({ ...card, playbackUrl: 'https://evil' })).toThrow(
      /playbackUrl/,
    );
  });
});
