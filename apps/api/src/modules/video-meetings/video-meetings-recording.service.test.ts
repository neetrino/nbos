import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import {
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
  VideoMeetingStatus,
} from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import { VideoMeetingsRecordingFinalizeService } from './video-meetings-recording-finalize.service';
import { VideoMeetingsRecordingLifecycleService } from './video-meetings-recording-lifecycle.service';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import type {
  VideoMeetingsEgressClient,
  VideoMeetingsRecordingObjectStore,
} from './video-meetings-egress.types';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';
import { serializeRecordingGroup } from './video-meetings-recording.serializer';
import { canMarkRecordingReadyFromMeetingEndedAlone } from '@nbos/shared';

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
const P1 = '22222222-2222-4222-8222-222222222222';
const P2 = '33333333-3333-4333-8333-333333333333';

function meetingRow() {
  return {
    id: MEETING_ID,
    status: VideoMeetingStatus.ACTIVE,
    hostEmployeeId: HOST.id,
    ownerEmployeeId: HOST.id,
  };
}

describe('VideoMeetingsRecordingService (S05)', () => {
  let prisma: MockPrisma;
  let egress: VideoMeetingsEgressClient;
  let objectStore: VideoMeetingsRecordingObjectStore;
  let finalize: {
    finalizeAsset: ReturnType<typeof vi.fn>;
    refreshGroupStatus: ReturnType<typeof vi.fn>;
  };
  let consent: {
    listLatestByParticipantIds: ReturnType<typeof vi.fn>;
    isGranted: ReturnType<typeof vi.fn>;
    getLatestForParticipant: ReturnType<typeof vi.fn>;
  };
  let service: VideoMeetingsRecordingService;
  let lifecycle: VideoMeetingsRecordingLifecycleService;

  beforeEach(() => {
    prisma = createMockPrisma();
    egress = {
      isConfigured: vi.fn().mockReturnValue(true),
      listParticipantIdentities: vi.fn().mockResolvedValue([P1, P2]),
      listPublishedAudioTracks: vi.fn().mockResolvedValue([
        { participantId: P1, trackId: 'TR_a' },
        { participantId: P2, trackId: 'TR_b' },
      ]),
      startRoomComposite: vi.fn().mockResolvedValue({ egressId: 'EG_comp' }),
      startTrackAudio: vi
        .fn()
        .mockResolvedValueOnce({ egressId: 'EG_a' })
        .mockResolvedValueOnce({ egressId: 'EG_b' }),
      stopEgress: vi.fn().mockResolvedValue(undefined),
    };
    objectStore = {
      isConfigured: vi.fn().mockReturnValue(true),
      getS3Config: vi.fn().mockReturnValue({
        accessKey: 'k',
        secret: 's',
        bucket: 'b',
        endpoint: 'http://127.0.0.1:9000',
        region: 'auto',
        forcePathStyle: true,
      }),
      headObject: vi.fn().mockResolvedValue({ exists: true, sizeBytes: 1024 }),
    };
    finalize = {
      finalizeAsset: vi.fn().mockResolvedValue(VideoMeetingRecordingAssetStatus.READY),
      refreshGroupStatus: vi.fn().mockResolvedValue(undefined),
    };
    consent = {
      listLatestByParticipantIds: vi.fn().mockResolvedValue(
        new Map([
          [P1, { decision: 'GRANTED' }],
          [P2, { decision: 'GRANTED' }],
        ]),
      ),
      isGranted: vi.fn((d) => d === 'GRANTED'),
      getLatestForParticipant: vi.fn().mockResolvedValue({ decision: 'UNKNOWN' }),
    };
    lifecycle = new VideoMeetingsRecordingLifecycleService(
      prisma as never,
      consent as unknown as VideoMeetingsConsentService,
      finalize as unknown as VideoMeetingsRecordingFinalizeService,
      egress,
    );
    service = new VideoMeetingsRecordingService(
      prisma as never,
      consent as unknown as VideoMeetingsConsentService,
      lifecycle,
      { get: () => undefined } as never,
      egress,
      objectStore,
    );
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue(meetingRow());
    prisma.videoMeetingSession.findFirst = vi.fn().mockResolvedValue({
      id: 'sess-1',
      livekitRoomName: 'vm_room',
      meetingId: MEETING_ID,
    });
    prisma.videoMeetingRecording.findFirst = vi.fn().mockResolvedValue(null);
    prisma.videoMeetingRecording.count = vi.fn().mockResolvedValue(0);
    prisma.videoMeetingRecording.create = vi.fn().mockResolvedValue({
      id: 'rec-1',
      meetingId: MEETING_ID,
      status: VideoMeetingRecordingStatus.PENDING,
    });
    prisma.videoMeetingRecordingAsset.create = vi
      .fn()
      .mockResolvedValueOnce({ id: 'asset-comp' })
      .mockResolvedValueOnce({ id: 'asset-a' })
      .mockResolvedValueOnce({ id: 'asset-b' });
    prisma.videoMeetingRecordingAsset.update = vi.fn().mockResolvedValue({});
    prisma.videoMeetingRecording.update = vi.fn().mockResolvedValue({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.RECORDING,
      startedAt: new Date(),
      stoppedAt: null,
      assets: [],
    });
  });

  it('rejects start when any capturable participant has unknown consent', async () => {
    consent.listLatestByParticipantIds.mockResolvedValue(
      new Map([
        [P1, { decision: 'GRANTED' }],
        // P2 missing → unknown
      ]),
    );

    await expect(service.start(HOST, MEETING_ID)).rejects.toBeInstanceOf(BadRequestException);
    expect(egress.startRoomComposite).not.toHaveBeenCalled();
  });

  it('does not open late-join audio egress before consent is GRANTED', async () => {
    consent.getLatestForParticipant.mockResolvedValue({ decision: 'UNKNOWN' });
    prisma.videoMeetingRecording.findFirst = vi.fn().mockResolvedValue({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.RECORDING,
      assets: [],
    });

    await service.startAudioSegmentForTrack({
      meetingId: MEETING_ID,
      participantId: P1,
      trackId: 'TR_new',
      roomName: 'vm_room',
    });

    expect(egress.startTrackAudio).not.toHaveBeenCalled();
  });

  it('stops composite and audio egress on consent withdrawal', async () => {
    const assets = [
      {
        id: 'asset-comp',
        participantId: null,
        kind: 'ROOM_COMPOSITE',
        egressId: 'EG_comp',
        status: VideoMeetingRecordingAssetStatus.PENDING,
        objectKey: 'composite-key',
      },
      {
        id: 'asset-a',
        participantId: P1,
        kind: 'PARTICIPANT_AUDIO',
        egressId: 'EG_a',
        status: VideoMeetingRecordingAssetStatus.PENDING,
        objectKey: 'audio-key',
      },
    ];
    prisma.videoMeetingRecording.findFirst = vi.fn().mockResolvedValue({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.RECORDING,
      assets,
    });
    prisma.videoMeetingRecording.findUniqueOrThrow = vi.fn().mockResolvedValue({
      id: 'rec-1',
      assets,
    });
    prisma.videoMeetingRecordingAsset.findMany = vi
      .fn()
      .mockResolvedValue([
        { status: VideoMeetingRecordingAssetStatus.PENDING },
        { status: VideoMeetingRecordingAssetStatus.PENDING },
      ]);
    prisma.videoMeetingRecordingAsset.update = vi.fn().mockResolvedValue({});
    finalize.finalizeAsset.mockResolvedValue(VideoMeetingRecordingAssetStatus.PENDING);
    prisma.videoMeetingRecording.update = vi.fn().mockResolvedValue({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.FINALIZING,
      startedAt: new Date(),
      stoppedAt: new Date(),
      assets,
    });

    await service.stopCaptureOnConsentWithdrawal(MEETING_ID);

    expect(egress.stopEgress).toHaveBeenCalledWith('EG_comp');
    expect(egress.stopEgress).toHaveBeenCalledWith('EG_a');
    expect(finalize.finalizeAsset).toHaveBeenCalledWith('asset-comp');
    expect(finalize.finalizeAsset).toHaveBeenCalledWith('asset-a');
    const readyUpdate = (
      prisma.videoMeetingRecording.update as ReturnType<typeof vi.fn>
    ).mock.calls.find((call) => call[0]?.data?.status === VideoMeetingRecordingStatus.READY);
    expect(readyUpdate).toBeUndefined();
  });

  it('does not mark recording READY when meeting ends alone', async () => {
    expect(canMarkRecordingReadyFromMeetingEndedAlone()).toBe(false);
    prisma.videoMeetingRecording.findFirst = vi.fn().mockResolvedValue({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.RECORDING,
      assets: [
        {
          id: 'a1',
          egressId: 'EG_comp',
          objectKey: 'comp',
          status: VideoMeetingRecordingAssetStatus.PENDING,
        },
      ],
    });
    prisma.videoMeetingRecording.findUniqueOrThrow = vi.fn().mockResolvedValue({
      id: 'rec-1',
      assets: [
        {
          id: 'a1',
          egressId: 'EG_comp',
          objectKey: 'comp',
          status: VideoMeetingRecordingAssetStatus.PENDING,
        },
      ],
    });
    prisma.videoMeetingRecordingAsset.findMany = vi
      .fn()
      .mockResolvedValue([{ status: VideoMeetingRecordingAssetStatus.PENDING }]);
    finalize.finalizeAsset.mockResolvedValue(VideoMeetingRecordingAssetStatus.PENDING);
    prisma.videoMeetingRecording.update = vi.fn().mockResolvedValue({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.FINALIZING,
      startedAt: new Date(),
      stoppedAt: new Date(),
      assets: [
        {
          id: 'a1',
          kind: 'ROOM_COMPOSITE',
          status: 'PENDING',
          participantId: null,
          rangeStartsAt: null,
          rangeEndsAt: null,
        },
      ],
    });

    await service.stopIfRecordingOnMeetingEnd(MEETING_ID);

    const updates = (prisma.videoMeetingRecording.update as ReturnType<typeof vi.fn>).mock.calls;
    const readyUpdate = updates.find(
      (call) => call[0]?.data?.status === VideoMeetingRecordingStatus.READY,
    );
    expect(readyUpdate).toBeUndefined();
  });

  it('deduplicates egress webhook — does not create a second asset row', async () => {
    prisma.videoMeetingRecordingAsset.findFirst = vi.fn().mockResolvedValue({
      id: 'asset-a',
      egressId: 'EG_a',
      status: VideoMeetingRecordingAssetStatus.READY,
      objectKey: 'key',
      recordingId: 'rec-1',
    });
    prisma.videoMeetingRecordingAsset.create = vi.fn();

    await service.applyEgressEnded('EG_a');

    expect(prisma.videoMeetingRecordingAsset.create).not.toHaveBeenCalled();
    expect(finalize.finalizeAsset).not.toHaveBeenCalled();
  });

  it('does not mark asset READY when object is unverified / zero size', async () => {
    prisma.videoMeetingRecordingAsset.findFirst = vi.fn().mockResolvedValue({
      id: 'asset-a',
      egressId: 'EG_a',
      status: VideoMeetingRecordingAssetStatus.PENDING,
      objectKey: 'key',
      recordingId: 'rec-1',
    });
    finalize.finalizeAsset.mockResolvedValue(VideoMeetingRecordingAssetStatus.FAILED);

    await service.applyEgressEnded('EG_a');

    expect(finalize.finalizeAsset).toHaveBeenCalledWith('asset-a');
    expect(finalize.refreshGroupStatus).toHaveBeenCalledWith('rec-1');
  });

  it('returns 503 when egress is not configured', async () => {
    (egress.isConfigured as ReturnType<typeof vi.fn>).mockReturnValue(false);
    await expect(service.start(HOST, MEETING_ID)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('guest recording serializer never leaks CRM/Drive/playback URLs', () => {
    const group = serializeRecordingGroup({
      id: 'rec-1',
      status: VideoMeetingRecordingStatus.RECORDING,
      startedAt: new Date(),
      stoppedAt: null,
      assets: [
        {
          id: 'a1',
          kind: 'ROOM_COMPOSITE',
          status: VideoMeetingRecordingAssetStatus.PENDING,
          participantId: null,
          rangeStartsAt: null,
          rangeEndsAt: null,
          objectKey: 'secret/key',
          egressId: 'EG_x',
          fileAssetId: 'file-1',
        },
      ],
    });
    expect(JSON.stringify(group)).not.toContain('secret/key');
    expect(JSON.stringify(group)).not.toContain('EG_x');
    expect(JSON.stringify(group)).not.toContain('file-1');
    assertSafeGuestPayload({ status: group.status, participantId: P1 });
  });
});
