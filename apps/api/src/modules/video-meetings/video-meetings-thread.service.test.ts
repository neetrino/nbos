import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VideoMeetingAdmissionStatus, VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';
import type { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VIDEO_MEETING_MESSAGE_MAX_LENGTH } from './video-meetings.constants';
import { VideoMeetingsThreadService } from './video-meetings-thread.service';

const MEETING_ID = '11111111-1111-4111-8111-111111111111';

const EMPLOYEE: CurrentUserPayload = {
  id: 'emp-1',
  email: 'emp@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Ann',
  lastName: 'Lee',
  permissions: { VIDEO_MEETINGS_VIEW: 'ALL' },
};

function meeting(status: VideoMeetingStatus) {
  return {
    id: MEETING_ID,
    status,
    hostEmployeeId: EMPLOYEE.id,
    ownerEmployeeId: EMPLOYEE.id,
    participants: [],
  };
}

function echoCreatedMessage(prisma: MockPrisma): void {
  prisma.videoMeetingMessage.create = vi
    .fn()
    .mockImplementation(({ data }) =>
      Promise.resolve({ id: 'msg-1', createdAt: new Date('2026-09-27T10:05:00.000Z'), ...data }),
    );
}

describe('VideoMeetingsThreadService — employee', () => {
  let prisma: MockPrisma;
  let service: VideoMeetingsThreadService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new VideoMeetingsThreadService(prisma as never, {} as VideoMeetingsInvitesService);
    echoCreatedMessage(prisma);
  });

  it('persists sessionId and participant id while the room is ACTIVE', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meeting(VideoMeetingStatus.ACTIVE));
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({ id: 'sess-open' });
    prisma.videoMeetingParticipant.findFirst = vi.fn().mockResolvedValue({ id: 'p-emp' });

    const message = await service.postMessage(EMPLOYEE, MEETING_ID, '  Hello team  ');

    expect(prisma.videoMeetingMessage.create).toHaveBeenCalledWith({
      data: {
        meetingId: MEETING_ID,
        sessionId: 'sess-open',
        authorParticipantId: 'p-emp',
        employeeId: EMPLOYEE.id,
        authorDisplayName: 'Ann Lee',
        body: 'Hello team',
      },
    });
    expect(message).toMatchObject({ type: 'message', sessionId: 'sess-open', body: 'Hello team' });
  });

  it.each([VideoMeetingStatus.IDLE, VideoMeetingStatus.CREATED, VideoMeetingStatus.ENDED])(
    'persists a null sessionId while the room is %s',
    async (status) => {
      prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meeting(status));

      await service.postMessage(EMPLOYEE, MEETING_ID, 'Follow-up');

      expect(prisma.videoMeetingMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: null,
          authorParticipantId: null,
          employeeId: EMPLOYEE.id,
        }),
      });
      expect(prisma.videoMeetingSession.findFirst).not.toHaveBeenCalled();
    },
  );

  it('rejects posting to a cancelled room', async () => {
    prisma.videoMeeting.findUnique = vi
      .fn()
      .mockResolvedValue(meeting(VideoMeetingStatus.CANCELLED));

    await expect(service.postMessage(EMPLOYEE, MEETING_ID, 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.videoMeetingMessage.create).not.toHaveBeenCalled();
  });

  it('rejects empty and over-long bodies before touching the database', async () => {
    await expect(service.postMessage(EMPLOYEE, MEETING_ID, '   ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    const tooLong = 'a'.repeat(VIDEO_MEETING_MESSAGE_MAX_LENGTH + 1);
    await expect(service.postMessage(EMPLOYEE, MEETING_ID, tooLong)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.videoMeeting.findUnique).not.toHaveBeenCalled();
  });

  it('hides the thread from employees who cannot view the room', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      ...meeting(VideoMeetingStatus.IDLE),
      hostEmployeeId: 'other',
      ownerEmployeeId: 'other',
    });

    await expect(service.getThread(EMPLOYEE, MEETING_ID)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('VideoMeetingsThreadService — guest', () => {
  let prisma: MockPrisma;
  let invites: { findAdmissibleBySecret: ReturnType<typeof vi.fn> };
  let service: VideoMeetingsThreadService;

  const admittedGuest = {
    id: 'p-guest',
    displayName: 'Client Guest',
    admissionStatus: VideoMeetingAdmissionStatus.ADMITTED,
    sessionId: 'sess-open',
  };

  beforeEach(() => {
    prisma = createMockPrisma();
    invites = {
      findAdmissibleBySecret: vi.fn().mockResolvedValue({ id: 'inv-1', meetingId: MEETING_ID }),
    };
    service = new VideoMeetingsThreadService(
      prisma as never,
      invites as unknown as VideoMeetingsInvitesService,
    );
    echoCreatedMessage(prisma);
    prisma.videoMeetingParticipant.findUnique = vi.fn().mockResolvedValue(admittedGuest);
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({ status: 'ACTIVE' });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({ id: 'sess-open' });
  });

  it('rejects an unknown invite with 404', async () => {
    invites.findAdmissibleBySecret.mockResolvedValue(null);
    await expect(service.guestThread('tok')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a guest still in the waiting room', async () => {
    prisma.videoMeetingParticipant.findUnique = vi.fn().mockResolvedValue({
      ...admittedGuest,
      admissionStatus: VideoMeetingAdmissionStatus.WAITING,
    });
    await expect(service.guestThread('tok')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.guestPostMessage('tok', 'hi')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.videoMeetingMessage.create).not.toHaveBeenCalled();
  });

  it('rejects a guest after the call ended (room IDLE)', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({ status: 'IDLE' });
    await expect(service.guestThread('tok')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a guest admitted only to a previous session', async () => {
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({ id: 'sess-new' });
    await expect(service.guestPostMessage('tok', 'hi')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.videoMeetingMessage.create).not.toHaveBeenCalled();
  });

  it('persists the guest display name and open session at send time', async () => {
    const message = await service.guestPostMessage('tok', ' Thanks! ');

    expect(prisma.videoMeetingMessage.create).toHaveBeenCalledWith({
      data: {
        meetingId: MEETING_ID,
        sessionId: 'sess-open',
        authorParticipantId: 'p-guest',
        employeeId: null,
        authorDisplayName: 'Client Guest',
        body: 'Thanks!',
      },
    });
    expect(message).not.toHaveProperty('employeeId');
    assertSafeGuestPayload(message);
  });
});
