import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  PrismaClient,
  VideoMeetingRecordingAssetKind,
  VideoMeetingRecordingAssetStatus,
  type Prisma,
} from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { DriveArtifactOperationService } from '../drive/artifact-operation/drive-artifact-operation.service';
import { DriveArtifactStorageAdapter } from '../drive/artifact-operation/drive-artifact-storage.adapter';
import { systemArtifactAuth } from '../drive/artifact-operation/drive-artifact-auth.ports';
import type { DriveArtifactStorage } from '../drive/artifact-operation/drive-artifact-operation.types';
import {
  VIDEO_MEETING_AUDIO_MIME,
  VIDEO_MEETING_COMPOSITE_MIME,
  VIDEO_MEETING_FILE_ENTITY_TYPE,
  VIDEO_MEETINGS_DRIVE_ARTIFACT_STORAGE_TOKEN,
  VIDEO_MEETINGS_RECORDING_SYSTEM_ACTOR_ID,
  VIDEO_MEETINGS_SOURCE_MODULE,
} from './video-meetings-recording.constants';
import {
  deriveRecordingGroupStatus,
  isNonEmptyObjectHead,
} from './video-meetings-recording-status';

type AssetWithRecording = Prisma.VideoMeetingRecordingAssetGetPayload<{
  include: { recording: { select: { id: true; meetingId: true; status: true } } };
}>;

/**
 * Egress object → Drive FileArtifactOperation prepare/verify/finalize.
 * Idempotency key = recording asset id (ADR-VM-002).
 */
@Injectable()
export class VideoMeetingsRecordingFinalizeService {
  private readonly logger = new Logger(VideoMeetingsRecordingFinalizeService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly artifacts: DriveArtifactOperationService,
    private readonly driveStorage: DriveArtifactStorageAdapter,
    @Optional()
    @Inject(VIDEO_MEETINGS_DRIVE_ARTIFACT_STORAGE_TOKEN)
    private readonly storageOverride: DriveArtifactStorage | null,
  ) {}

  private storage(): DriveArtifactStorage {
    return this.storageOverride ?? this.driveStorage;
  }

  /**
   * Verify object bytes then Drive-finalize. READY only after Drive COMPLETED.
   * Safe to call twice for the same asset / egress id.
   */
  async finalizeAsset(assetId: string): Promise<VideoMeetingRecordingAssetStatus> {
    const asset = await this.prisma.videoMeetingRecordingAsset.findUnique({
      where: { id: assetId },
      include: { recording: { select: { id: true, meetingId: true, status: true } } },
    });
    if (!asset) return VideoMeetingRecordingAssetStatus.FAILED;
    if (asset.status === VideoMeetingRecordingAssetStatus.READY && asset.fileAssetId) {
      return VideoMeetingRecordingAssetStatus.READY;
    }
    if (!asset.objectKey) {
      return this.markAsset(asset.id, VideoMeetingRecordingAssetStatus.FAILED, null);
    }

    const head = await this.safeHead(asset.objectKey);
    if (!isNonEmptyObjectHead(head)) {
      const next =
        head.contentLength === 0 || (head.exists === true && head.sizeBytes === 0)
          ? VideoMeetingRecordingAssetStatus.FAILED
          : VideoMeetingRecordingAssetStatus.PENDING;
      return this.markAsset(asset.id, next, null);
    }

    try {
      return await this.driveFinalize(
        asset as AssetWithRecording,
        head.contentLength ?? head.sizeBytes ?? null,
      );
    } catch (error) {
      return this.handleFinalizeError(asset.id, error);
    }
  }

  async refreshGroupStatus(recordingId: string): Promise<void> {
    const recording = await this.prisma.videoMeetingRecording.findUnique({
      where: { id: recordingId },
      include: { assets: true },
    });
    if (!recording) return;
    if (recording.status === 'RECORDING' || recording.status === 'PENDING') return;
    const next = deriveRecordingGroupStatus(recording.assets);
    if (next !== recording.status) {
      await this.prisma.videoMeetingRecording.update({
        where: { id: recordingId },
        data: { status: next },
      });
    }
  }

  private async driveFinalize(
    asset: AssetWithRecording,
    sizeBytes: number | null,
  ): Promise<VideoMeetingRecordingAssetStatus> {
    const mime =
      asset.kind === VideoMeetingRecordingAssetKind.ROOM_COMPOSITE
        ? VIDEO_MEETING_COMPOSITE_MIME
        : VIDEO_MEETING_AUDIO_MIME;
    const displayName = this.displayName(asset);
    const actorId = VIDEO_MEETINGS_RECORDING_SYSTEM_ACTOR_ID;
    const operation = await this.artifacts.prepare({
      source: 'SYSTEM',
      ingress: 'MACHINE_PUT',
      kind: 'CREATE_ASSET',
      storageKey: asset.objectKey!,
      entityType: VIDEO_MEETING_FILE_ENTITY_TYPE,
      entityId: asset.recording.meetingId,
      displayName,
      originalName: displayName,
      mimeType: mime,
      purpose: 'MEETING_RECORDING',
      sourceModule: VIDEO_MEETINGS_SOURCE_MODULE,
      visibility: 'INTERNAL',
      confidentiality: 'CONFIDENTIAL',
      linkType: 'ATTACHMENT',
      expectedSizeBytes: sizeBytes,
      actorType: 'SYSTEM',
      actorId,
      idempotencyKey: asset.id,
      correlationId: asset.egressId ?? asset.id,
    });

    const result = await this.artifacts.finalizeAfterObjectPresent(
      operation.id,
      { sizeBytes },
      systemArtifactAuth(actorId),
      this.storage(),
    );

    await this.prisma.videoMeetingRecordingAsset.update({
      where: { id: asset.id },
      data: {
        status: VideoMeetingRecordingAssetStatus.READY,
        fileAssetId: result.fileAssetId,
        rangeEndsAt: new Date(),
      },
    });
    return VideoMeetingRecordingAssetStatus.READY;
  }

  private async handleFinalizeError(
    assetId: string,
    error: unknown,
  ): Promise<VideoMeetingRecordingAssetStatus> {
    const message = error instanceof Error ? error.message : String(error);
    const retryable =
      message.includes('not found in storage') ||
      message.includes('not configured') ||
      message.includes('R2');
    this.logger.warn(`Recording Drive finalize ${retryable ? 'retryable' : 'failed'}: ${message}`);
    if (retryable) {
      return this.markAsset(assetId, VideoMeetingRecordingAssetStatus.PENDING, null);
    }
    return this.markAsset(assetId, VideoMeetingRecordingAssetStatus.FAILED, null);
  }

  private async safeHead(objectKey: string): Promise<{
    exists?: boolean;
    sizeBytes?: number;
    contentLength?: number | null;
  }> {
    try {
      const head = await this.storage().headObject(objectKey);
      if (!head) return { exists: false, sizeBytes: 0, contentLength: null };
      return {
        exists: true,
        sizeBytes: head.contentLength ?? 0,
        contentLength: head.contentLength,
      };
    } catch (error) {
      this.logger.warn(`Drive HeadObject unavailable (retry later): ${String(error)}`);
      return { exists: false, sizeBytes: 0, contentLength: null };
    }
  }

  private async markAsset(
    assetId: string,
    status: VideoMeetingRecordingAssetStatus,
    fileAssetId: string | null,
  ): Promise<VideoMeetingRecordingAssetStatus> {
    await this.prisma.videoMeetingRecordingAsset.update({
      where: { id: assetId },
      data: { status, fileAssetId, rangeEndsAt: new Date() },
    });
    return status;
  }

  private displayName(asset: AssetWithRecording): string {
    if (asset.kind === VideoMeetingRecordingAssetKind.ROOM_COMPOSITE) {
      return `meeting-recording-${asset.recording.id}-composite.mp4`;
    }
    const participant = asset.participantId ?? 'unknown';
    return `meeting-recording-${asset.recording.id}-audio-${participant}.ogg`;
  }
}
