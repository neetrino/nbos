import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
  VideoMeetingRecordingStatus,
} from '@nbos/database';
import type { CurrentUserPayload } from '../../common/decorators';
import { createMockPrisma, type MockPrisma } from '../../test-utils/mock-prisma';
import { InMemoryDriveArtifactStorage } from '../drive/artifact-operation/in-memory-drive-artifact-storage';
import { DriveArtifactOperationService } from '../drive/artifact-operation/drive-artifact-operation.service';
import { DriveArtifactStorageAdapter } from '../drive/artifact-operation/drive-artifact-storage.adapter';
import { VideoMeetingsRecordingFinalizeService } from './video-meetings-recording-finalize.service';
import { VideoMeetingsRecordingPlaybackService } from './video-meetings-recording-playback.service';
import { deriveRecordingGroupStatus } from './video-meetings-recording-status';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';
import { serializeGuestRecordingIndicator } from './video-meetings-recording.serializer';
import {
  VIDEO_MEETING_FILE_ENTITY_TYPE,
  VIDEO_MEETINGS_RECORDING_SYSTEM_ACTOR_ID,
  VIDEO_MEETINGS_SOURCE_MODULE,
} from './video-meetings-recording.constants';
import { VideoMeetingsRecordingWebhookController } from './video-meetings-recording-webhook.controller';

const MEETING_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ASSET_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OBJECT_KEY = `video-meetings/${MEETING_ID}/recordings/rec-1/composite.mp4`;

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

describe('VideoMeetingsRecordingFinalizeService (S06)', () => {
  let prisma: MockPrisma;
  let storage: InMemoryDriveArtifactStorage;
  let artifacts: {
    prepare: ReturnType<typeof vi.fn>;
    finalizeAfterObjectPresent: ReturnType<typeof vi.fn>;
  };
  let service: VideoMeetingsRecordingFinalizeService;
  let fileAssetCreates: number;

  beforeEach(async () => {
    prisma = createMockPrisma();
    storage = new InMemoryDriveArtifactStorage();
    fileAssetCreates = 0;
    artifacts = {
      prepare: vi.fn().mockImplementation(async (input: { idempotencyKey?: string }) => ({
        id: `op-${input.idempotencyKey ?? 'x'}`,
        status: 'PREPARED',
      })),
      finalizeAfterObjectPresent: vi.fn().mockImplementation(async () => {
        fileAssetCreates += 1;
        return {
          fileAssetId: 'file-asset-1',
          fileVersionId: 'ver-1',
          fileLinkId: 'link-1',
        };
      }),
    };

    service = new VideoMeetingsRecordingFinalizeService(
      prisma as never,
      artifacts as unknown as DriveArtifactOperationService,
      { headObject: (key: string) => storage.headObject(key) } as DriveArtifactStorageAdapter,
      storage,
    );

    prisma.videoMeetingRecordingAsset.findUnique = vi.fn().mockResolvedValue({
      id: ASSET_ID,
      kind: VideoMeetingRecordingAssetKind.ROOM_COMPOSITE,
      status: VideoMeetingRecordingAssetStatus.PENDING,
      objectKey: OBJECT_KEY,
      fileAssetId: null,
      egressId: 'EG_1',
      participantId: null,
      recording: { id: 'rec-1', meetingId: MEETING_ID, status: 'FINALIZING' },
    });
    prisma.videoMeetingRecordingAsset.update = vi.fn().mockResolvedValue({});
  });

  it('finalizes through Drive and writes fileAssetId only after COMPLETED', async () => {
    await storage.putObject(OBJECT_KEY, new Uint8Array([1, 2, 3, 4]), 'video/mp4');

    const status = await service.finalizeAsset(ASSET_ID);

    expect(status).toBe(VideoMeetingRecordingAssetStatus.READY);
    expect(artifacts.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'SYSTEM',
        ingress: 'MACHINE_PUT',
        actorId: VIDEO_MEETINGS_RECORDING_SYSTEM_ACTOR_ID,
        sourceModule: VIDEO_MEETINGS_SOURCE_MODULE,
        purpose: 'MEETING_RECORDING',
        entityType: VIDEO_MEETING_FILE_ENTITY_TYPE,
        entityId: MEETING_ID,
        idempotencyKey: ASSET_ID,
        storageKey: OBJECT_KEY,
      }),
    );
    expect(prisma.videoMeetingRecordingAsset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: VideoMeetingRecordingAssetStatus.READY,
          fileAssetId: 'file-asset-1',
        }),
      }),
    );
  });

  it('idempotent webhook finalize — second call does not create a second FileAsset', async () => {
    await storage.putObject(OBJECT_KEY, new Uint8Array([9, 9, 9]), 'video/mp4');

    await service.finalizeAsset(ASSET_ID);
    prisma.videoMeetingRecordingAsset.findUnique = vi.fn().mockResolvedValue({
      id: ASSET_ID,
      kind: VideoMeetingRecordingAssetKind.ROOM_COMPOSITE,
      status: VideoMeetingRecordingAssetStatus.READY,
      objectKey: OBJECT_KEY,
      fileAssetId: 'file-asset-1',
      egressId: 'EG_1',
      participantId: null,
      recording: { id: 'rec-1', meetingId: MEETING_ID, status: 'FINALIZING' },
    });
    await service.finalizeAsset(ASSET_ID);

    expect(fileAssetCreates).toBe(1);
    expect(artifacts.finalizeAfterObjectPresent).toHaveBeenCalledTimes(1);
  });

  it('object missing or zero-byte → not READY', async () => {
    const missing = await service.finalizeAsset(ASSET_ID);
    expect(missing).toBe(VideoMeetingRecordingAssetStatus.PENDING);
    expect(artifacts.prepare).not.toHaveBeenCalled();

    await storage.putObject(OBJECT_KEY, new Uint8Array([]), 'video/mp4');
    const zero = await service.finalizeAsset(ASSET_ID);
    expect(zero).toBe(VideoMeetingRecordingAssetStatus.FAILED);
    expect(artifacts.finalizeAfterObjectPresent).not.toHaveBeenCalled();
  });

  it('partial asset set → group PARTIAL', () => {
    const status = deriveRecordingGroupStatus([
      { status: VideoMeetingRecordingAssetStatus.READY },
      { status: VideoMeetingRecordingAssetStatus.FAILED },
      { status: VideoMeetingRecordingAssetStatus.READY },
    ]);
    expect(status).toBe(VideoMeetingRecordingStatus.PARTIAL);
  });

  it('guest payload still has no playback URL', () => {
    const guest = serializeGuestRecordingIndicator({
      status: VideoMeetingRecordingStatus.READY,
    });
    expect(JSON.stringify(guest)).not.toMatch(/playback|url|fileAsset/i);
    assertSafeGuestPayload(guest);
  });
});

describe('VideoMeetingsRecordingPlaybackService (S06)', () => {
  let prisma: MockPrisma;
  let playback: VideoMeetingsRecordingPlaybackService;

  beforeEach(() => {
    prisma = createMockPrisma();
    playback = new VideoMeetingsRecordingPlaybackService(
      prisma as never,
      {
        bucket: 'test',
        ensureS3: () => {
          throw new Error('R2 not configured');
        },
      } as never,
    );
  });

  it('unauthorized playback 403 for viewer who is not host/owner/participant', async () => {
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      hostEmployeeId: 'other-host',
      ownerEmployeeId: 'other-owner',
      participants: [],
    });

    await expect(playback.getCompositePlayback(HOST, MEETING_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('entity link alone does not grant playback (403)', async () => {
    // Caller has VIEW permission at the HTTP layer, but meeting ACL fails without membership.
    const entityOnly: CurrentUserPayload = {
      ...HOST,
      id: 'emp-entity-only',
      permissions: { VIDEO_MEETINGS_VIEW: 'ALL', CRM_DEALS_VIEW: 'ALL' },
    };
    prisma.videoMeeting.findUnique = vi.fn().mockResolvedValue({
      id: MEETING_ID,
      hostEmployeeId: 'host',
      ownerEmployeeId: 'owner',
      participants: [],
      entityLinks: [{ entityType: 'DEAL', entityId: 'deal-1' }],
    });

    await expect(playback.getCompositePlayback(entityOnly, MEETING_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('VideoMeetingsRecordingWebhookController (S06)', () => {
  it('rejects unsigned webhook', async () => {
    const webhooks = { handleEvent: vi.fn() };
    const controller = new VideoMeetingsRecordingWebhookController(
      {
        get: (key: string) =>
          key.includes('KEY') || key.includes('SECRET') ? 'test-value' : undefined,
      } as never,
      webhooks as never,
    );

    await expect(
      controller.handle({ body: { event: 'egress_ended' } }, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(webhooks.handleEvent).not.toHaveBeenCalled();
  });
});
