import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoMeetingRecordingAssetKind, VideoMeetingRecordingAssetStatus } from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { VideoMeetingsRecordingPlaybackService } from './video-meetings-recording-playback.service';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.example/play.mp4'),
}));

const MEETING_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RECORDING_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ASSET_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const FILE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const HOST: CurrentUserPayload = {
  id: 'emp-host',
  email: 'host@nbos.test',
  role: 'owner',
  roleLevel: 0,
  departmentIds: [],
  firstName: 'Host',
  lastName: 'User',
  permissions: { VIDEO_MEETINGS_VIEW: 'ALL' },
};

describe('VideoMeetingsRecordingPlaybackService.getRecordingCompositePlayback', () => {
  let prisma: MockPrisma;
  let playback: VideoMeetingsRecordingPlaybackService;

  beforeEach(() => {
    prisma = createMockPrisma();
    playback = new VideoMeetingsRecordingPlaybackService(
      prisma as never,
      {
        bucket: 'test',
        ensureS3: () => ({}) as never,
      } as never,
    );
  });

  it('403 when caller is not a meeting viewer', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      hostEmployeeId: 'other-host',
      ownerEmployeeId: 'other-owner',
      participants: [],
    });

    await expect(
      playback.getRecordingCompositePlayback(HOST, MEETING_ID, RECORDING_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('404 when recording has no READY composite on this meeting', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      participants: [{ employeeId: HOST.id }],
    });
    prisma.videoMeetingRecordingAsset.findFirst = vi.fn().mockResolvedValue(null);

    await expect(
      playback.getRecordingCompositePlayback(HOST, MEETING_ID, RECORDING_ID),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.videoMeetingRecordingAsset.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: VideoMeetingRecordingAssetKind.ROOM_COMPOSITE,
          status: VideoMeetingRecordingAssetStatus.READY,
          recording: { id: RECORDING_ID, meetingId: MEETING_ID },
        }),
      }),
    );
  });

  it('returns signed URL for READY ROOM_COMPOSITE on the recording', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      hostEmployeeId: HOST.id,
      ownerEmployeeId: HOST.id,
      participants: [{ employeeId: HOST.id }],
    });
    prisma.videoMeetingRecordingAsset.findFirst = vi.fn().mockResolvedValue({
      id: ASSET_ID,
      fileAssetId: FILE_ID,
    });
    prisma.fileAsset.findFirst = vi.fn().mockResolvedValue({
      id: FILE_ID,
      mimeType: 'video/mp4',
      storageKey: 'key/composite.mp4',
      versions: [],
    });

    const result = await playback.getRecordingCompositePlayback(HOST, MEETING_ID, RECORDING_ID);

    expect(result).toMatchObject({
      assetId: ASSET_ID,
      kind: 'ROOM_COMPOSITE',
      url: 'https://signed.example/play.mp4',
      mimeType: 'video/mp4',
    });
  });
});
