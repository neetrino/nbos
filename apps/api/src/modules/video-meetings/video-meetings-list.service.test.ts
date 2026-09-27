import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingEntityLinkTypeDto } from './dto/video-meetings.dto';
import { VideoMeetingsListService } from './video-meetings-list.service';

const USER: CurrentUserPayload = {
  id: 'emp-1',
  email: 'emp@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Ann',
  lastName: 'Lee',
  permissions: { VIDEO_MEETINGS_VIEW: 'ALL', CLIENTS_VIEW: 'ALL' },
};

const CONTACT_QUERY = { entityType: VideoMeetingEntityLinkTypeDto.CONTACT, entityId: 'contact-1' };

const at = (iso: string) => new Date(`2026-09-${iso}Z`);

function room(
  id: string,
  updatedAt: Date,
  sessions: { startedAt: Date | null; endedAt: Date | null }[],
) {
  return {
    id,
    title: id,
    status: VideoMeetingStatus.IDLE,
    hostEmployeeId: USER.id,
    ownerEmployeeId: USER.id,
    scheduledStartsAt: null,
    scheduledEndsAt: null,
    endedAt: null,
    cancelledAt: null,
    calendarMeetingId: null,
    createdAt: at('01T09:00:00'),
    updatedAt,
    entityLinks: [],
    sessions: sessions.map((session, index) => ({
      id: `${id}-s${index}`,
      livekitRoomName: `vm_${id}`,
      createdAt: session.startedAt ?? updatedAt,
      ...session,
    })),
    messages: [],
    _count: { recordings: 2 },
  };
}

describe('VideoMeetingsListService', () => {
  let prisma: MockPrisma;
  let service: VideoMeetingsListService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new VideoMeetingsListService(prisma as never);
    prisma.contact.findUnique = vi.fn().mockResolvedValue({ id: 'contact-1' });
    prisma.contact.findFirst = vi.fn().mockResolvedValue({ id: 'contact-1' });
  });

  it('by-entity returns the most recently active linked room', async () => {
    const older = room('older', at('27T08:00:00'), [
      { startedAt: at('20T10:00:00'), endedAt: at('20T11:00:00') },
    ]);
    const recent = room('recent', at('21T08:00:00'), [
      { startedAt: at('26T10:00:00'), endedAt: at('26T11:00:00') },
    ]);
    prisma.videoMeeting.findMany = vi.fn().mockResolvedValue([older, recent]);

    const item = await service.byEntity(USER, CONTACT_QUERY);

    expect(item).toMatchObject({ id: 'recent', recordingCount: 2 });
    expect(item?.lastActivityAt).toBe(at('26T11:00:00').toISOString());
    const [args] = vi.mocked(prisma.videoMeeting.findMany).mock.calls[0] as [
      { where: { AND: unknown[] } },
    ];
    expect(args.where.AND).toEqual(
      expect.arrayContaining([
        { status: { not: VideoMeetingStatus.CANCELLED } },
        { entityLinks: { some: { entityType: 'CONTACT', entityId: 'contact-1' } } },
      ]),
    );
  });

  it('by-entity returns null when no accessible room is linked', async () => {
    prisma.videoMeeting.findMany = vi.fn().mockResolvedValue([]);
    await expect(service.byEntity(USER, CONTACT_QUERY)).resolves.toBeNull();
  });

  it('by-entity refuses callers without access to the record', async () => {
    const noClients = { ...USER, permissions: { VIDEO_MEETINGS_VIEW: 'ALL' } };
    await expect(service.byEntity(noClients, CONTACT_QUERY)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.videoMeeting.findMany).not.toHaveBeenCalled();
  });

  it('history lists idle (and legacy ended) rooms that were held at least once', async () => {
    prisma.videoMeeting.findMany = vi.fn().mockResolvedValue([]);
    prisma.videoMeeting.count = vi.fn().mockResolvedValue(0);

    await service.history(USER, {});

    const [args] = vi.mocked(prisma.videoMeeting.findMany).mock.calls[0] as [
      { where: { AND: unknown[] } },
    ];
    expect(args.where.AND).toEqual(
      expect.arrayContaining([
        { status: { in: [VideoMeetingStatus.IDLE, VideoMeetingStatus.ENDED] } },
        { sessions: { some: {} } },
      ]),
    );
  });
});
