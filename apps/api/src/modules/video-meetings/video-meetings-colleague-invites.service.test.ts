import { describe, expect, it, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  EmployeeStatusEnum,
  VideoMeetingAdmissionStatus,
  VideoMeetingParticipantKind,
  VideoMeetingStatus,
} from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import type { NotificationService } from '../notifications/notification.service';
import { VideoMeetingsColleagueInvitesService } from './video-meetings-colleague-invites.service';
import { VIDEO_MEETING_COLLEAGUE_INVITE_NOTIFICATION_TYPE } from './video-meetings.constants';

const HOST: CurrentUserPayload = {
  id: 'emp-host',
  email: 'host@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Host',
  lastName: 'User',
  permissions: { VIDEO_MEETINGS_EDIT: 'ALL', VIDEO_MEETINGS_VIEW: 'ALL' },
};

const COLLEAGUE: CurrentUserPayload = {
  ...HOST,
  id: 'emp-colleague',
  email: 'colleague@nbos.test',
  firstName: 'Ada',
  lastName: 'Lovelace',
};

describe('VideoMeetingsColleagueInvitesService', () => {
  let service: VideoMeetingsColleagueInvitesService;
  let prisma: MockPrisma;
  let notifications: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = createMockPrisma();
    notifications = { create: vi.fn().mockResolvedValue({ id: 'n1' }) };
    service = new VideoMeetingsColleagueInvitesService(
      prisma as never,
      notifications as unknown as NotificationService,
    );
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      title: 'Мгновенная встреча',
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      status: VideoMeetingStatus.ACTIVE,
    });
  });

  it('invites a colleague into WAITING and notifies without minting a token', async () => {
    prisma.employee.findMany = vi.fn().mockResolvedValue([
      {
        id: COLLEAGUE.id,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: COLLEAGUE.email,
      },
    ]);
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue(null);
    prisma.videoMeetingParticipant.create = vi.fn().mockResolvedValue({
      id: 'p-colleague',
      employeeId: COLLEAGUE.id,
      displayName: 'Ada Lovelace',
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      createdAt: new Date('2026-09-26T12:00:00.000Z'),
    });

    const rows = await service.invite(HOST, 'm1', [COLLEAGUE.id]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.admissionStatus).toBe('WAITING');
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: EmployeeStatusEnum.ACTIVE,
        }),
      }),
    );
    expect(prisma.videoMeetingParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: VideoMeetingParticipantKind.EMPLOYEE,
          employeeId: COLLEAGUE.id,
          admissionStatus: VideoMeetingAdmissionStatus.WAITING,
        }),
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: COLLEAGUE.id,
        type: VIDEO_MEETING_COLLEAGUE_INVITE_NOTIFICATION_TYPE,
        entityId: 'm1',
      }),
    );
  });

  it('accept admits the colleague without guest waiting-room flow', async () => {
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue({
      id: 'p-colleague',
      employeeId: COLLEAGUE.id,
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      joinedAt: null,
    });
    prisma.videoMeetingParticipant.update = vi.fn().mockResolvedValue({
      id: 'p-colleague',
      admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
    });

    const result = await service.accept(COLLEAGUE, 'm1');

    expect(result.admissionStatus).toBe('ADMITTED');
    expect(prisma.videoMeetingParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
        }),
      }),
    );
  });

  it('decline records REJECTED so a publish token must not be minted later', async () => {
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue({
      id: 'p-colleague',
      employeeId: COLLEAGUE.id,
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      joinedAt: null,
    });
    prisma.videoMeetingParticipant.update = vi.fn().mockResolvedValue({
      id: 'p-colleague',
      admissionStatus: VideoMeetingAdmissionStatus.REJECTED,
    });

    const result = await service.decline(COLLEAGUE, 'm1');

    expect(result.admissionStatus).toBe('REJECTED');
    expect(prisma.videoMeetingParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          admissionStatus: VideoMeetingAdmissionStatus.REJECTED,
        }),
      }),
    );
  });

  it('does not notify while the meeting has not started', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      title: 'Meeting 1',
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      status: VideoMeetingStatus.CREATED,
    });
    prisma.employee.findMany = vi.fn().mockResolvedValue([
      {
        id: COLLEAGUE.id,
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: COLLEAGUE.email,
      },
    ]);
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue(null);
    prisma.videoMeetingParticipant.create = vi.fn().mockResolvedValue({
      id: 'p-colleague',
      employeeId: COLLEAGUE.id,
      displayName: 'Ada Lovelace',
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
      createdAt: new Date('2026-09-26T12:00:00.000Z'),
    });

    await service.invite(HOST, 'm1', [COLLEAGUE.id]);

    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('releases waiting invites once the meeting is live', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      title: 'Meeting 1',
      status: VideoMeetingStatus.ACTIVE,
    });
    prisma.videoMeetingParticipant.findMany = vi
      .fn()
      .mockResolvedValue([{ employeeId: COLLEAGUE.id }]);

    await service.releaseWaitingInvites(HOST, 'm1');

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: COLLEAGUE.id, entityId: 'm1' }),
    );
  });

  it('rejects invite from a non-host', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: 'm1',
      title: 'Meet',
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      status: VideoMeetingStatus.ACTIVE,
    });
    await expect(service.invite(COLLEAGUE, 'm1', [HOST.id])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects empty colleague selection after filtering self', async () => {
    await expect(service.invite(HOST, 'm1', [HOST.id])).rejects.toBeInstanceOf(BadRequestException);
  });
});
