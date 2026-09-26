import { describe, it, expect, vi } from 'vitest';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoMeetingStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import { VideoMeetingsRecordingFinalizeService } from './video-meetings-recording-finalize.service';
import { VideoMeetingsRecordingLifecycleService } from './video-meetings-recording-lifecycle.service';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import type {
  VideoMeetingsEgressClient,
  VideoMeetingsRecordingObjectStore,
} from './video-meetings-egress.types';
import {
  assertRecordingCapacityAvailable,
  readMaxConcurrentRecordingGroups,
} from './video-meetings-recording-capacity';
import {
  VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_DEFAULT,
  VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_ENV,
} from './video-meetings-recording.constants';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { CalendarService } from '../calendar/calendar.service';

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

const MEETING_ID = '11111111-1111-4111-8111-111111111111';

describe('recording capacity (S07)', () => {
  it('defaults to documented dev safety valve when env unset', () => {
    const config = { get: () => undefined } as unknown as ConfigService;
    expect(readMaxConcurrentRecordingGroups(config)).toBe(
      VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_DEFAULT,
    );
  });

  it('rejects when active recording groups meet the cap', async () => {
    const prisma = createMockPrisma();
    prisma.videoMeetingRecording.count = vi.fn().mockResolvedValue(2);
    const config = {
      get: (key: string) =>
        key === VIDEO_MEETINGS_MAX_CONCURRENT_RECORDING_GROUPS_ENV ? '2' : undefined,
    } as unknown as ConfigService;

    await expect(assertRecordingCapacityAvailable(prisma as never, config)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('recording start capacity reject leaves meeting ACTIVE (does not end it)', async () => {
    const prisma = createMockPrisma();
    const egress: VideoMeetingsEgressClient = {
      isConfigured: vi.fn().mockReturnValue(true),
      listParticipantIdentities: vi.fn().mockResolvedValue(['p1']),
      listPublishedAudioTracks: vi.fn().mockResolvedValue([]),
      startRoomComposite: vi.fn(),
      startTrackAudio: vi.fn(),
      stopEgress: vi.fn(),
    };
    const objectStore: VideoMeetingsRecordingObjectStore = {
      isConfigured: vi.fn().mockReturnValue(true),
      getS3Config: vi.fn().mockReturnValue({
        accessKey: 'k',
        secret: 's',
        bucket: 'b',
        endpoint: 'http://127.0.0.1:9000',
        region: 'auto',
        forcePathStyle: true,
      }),
      headObject: vi.fn(),
    };
    const consent = {
      listLatestByParticipantIds: vi
        .fn()
        .mockResolvedValue(new Map([['p1', { decision: 'GRANTED' }]])),
      isGranted: vi.fn().mockReturnValue(true),
    };
    const finalize = { finalizeAsset: vi.fn(), refreshGroupStatus: vi.fn() };
    const lifecycle = new VideoMeetingsRecordingLifecycleService(
      prisma as never,
      consent as unknown as VideoMeetingsConsentService,
      finalize as unknown as VideoMeetingsRecordingFinalizeService,
      egress,
    );
    const service = new VideoMeetingsRecordingService(
      prisma as never,
      consent as unknown as VideoMeetingsConsentService,
      lifecycle,
      { get: () => '1' } as never,
      egress,
      objectStore,
    );

    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      status: VideoMeetingStatus.ACTIVE,
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
    });
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 'sess-1',
      livekitRoomName: 'vm_room',
    });
    prisma.videoMeetingRecording.findFirst = vi.fn().mockResolvedValue(null);
    prisma.videoMeetingRecording.count = vi.fn().mockResolvedValue(1);
    prisma.videoMeeting.update = vi.fn();

    await expect(service.start(HOST, MEETING_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.videoMeeting.update).not.toHaveBeenCalled();
    expect(egress.startRoomComposite).not.toHaveBeenCalled();
  });
});

describe('isolation without LiveKit (S07 A11)', () => {
  it('LiveKit service boots without env; mint returns 503', async () => {
    const livekit = new VideoMeetingsLivekitService({
      get: () => undefined,
    } as unknown as ConfigService);
    expect(livekit.isConfigured()).toBe(false);
    await expect(
      livekit.mintJoinToken({
        roomName: 'vm_x',
        participantId: 'p1',
        displayName: 'Host',
        role: 'host',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('CalendarService createMeeting still works without LiveKit env', async () => {
    const prisma = createMockPrisma();
    prisma.calendarMeeting.create = vi.fn().mockResolvedValue({
      id: 'cal-1',
      title: 'Client',
      projectId: null,
    });
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const calendar = new CalendarService(prisma as never, audit as never);
    const startsAt = new Date('2026-10-01T10:00:00.000Z');
    const endsAt = new Date('2026-10-01T11:00:00.000Z');
    prisma.calendarMeeting.findMany = vi.fn().mockResolvedValue([]);

    const created = await calendar.createMeeting('u1', {
      title: 'Client sync',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: 'SCHEDULED',
      locationType: 'ONLINE',
    });
    expect(created.id).toBe('cal-1');
    expect(prisma.calendarMeeting.create).toHaveBeenCalled();
  });
});
