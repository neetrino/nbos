import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { Readable } from 'node:stream';
import type { CurrentUserPayload } from '../../../common/decorators';
import { PRISMA_TOKEN } from '../../../database.module';
import { DriveAccessContextService } from '../../drive/drive-access-context.service';
import { DriveR2Client } from '../../drive/drive-r2.client';
import { recordingPlaybackMime } from '../../integrations/ats/ats-recording-mime';
import { findCallRecordingStorage, hasDriveViewPermission } from './call-recording-storage.op';
import { CallAccessPolicyService } from './call-access-policy.service';
import { callAccessActorFromUser } from './call-access.types';
import { assertCanPlayCallRecording } from './calls-recording-play';
import {
  fullRecordingHeaders,
  partialRecordingHeaders,
  recordingStreamFile,
} from './calls-recording-playback';
import {
  parseSingleByteRange,
  r2ByteRangeHeader,
  toSafeByteLength,
  type RecordingPlaybackResult,
} from './calls-recording-range';
import { isS3RangeNotSatisfiable } from './calls-recording-s3-error';
import { CALL_RECORDING_UNAVAILABLE_MESSAGE } from './calls.constants';

const PLAYBACK_SELECT = {
  id: true,
  recordingStatus: true,
  recordingFileAssetId: true,
} as const;

type ReadyRecording = { recordingFileAssetId: string };

type RecordingObject = {
  storageKey: string;
  mimeType: string | null;
  sizeBytes: bigint | number | null;
};

@Injectable()
export class CallsRecordingService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
    private readonly access: CallAccessPolicyService,
    private readonly driveAccess: DriveAccessContextService,
  ) {}

  async streamRecording(
    callId: string,
    user: CurrentUserPayload,
    rangeHeader?: string,
  ): Promise<RecordingPlaybackResult> {
    const actor = callAccessActorFromUser(user);
    await this.access.assertCanAccessCall(actor, callId);
    assertCanPlayCallRecording(user.permissions);
    const recording = await this.loadReadyRecording(callId);
    return this.streamAuthorizedRecording(recording.recordingFileAssetId, user, rangeHeader);
  }

  private async loadReadyRecording(callId: string): Promise<ReadyRecording> {
    const call = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: PLAYBACK_SELECT,
    });
    if (!call || call.recordingStatus !== 'READY' || !call.recordingFileAssetId) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    return { recordingFileAssetId: call.recordingFileAssetId };
  }

  private async streamAuthorizedRecording(
    fileAssetId: string,
    user: CurrentUserPayload,
    rangeHeader: string | undefined,
  ): Promise<RecordingPlaybackResult> {
    if (!hasDriveViewPermission(user.permissions)) {
      throw new ForbiddenException('No permission: DRIVE.VIEW');
    }
    await this.driveAccess.fromRequest(user, user.permissions.DRIVE_VIEW);
    const file = await findCallRecordingStorage(this.prisma, fileAssetId);
    if (!file?.storageKey) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    return this.streamFromR2(
      { storageKey: file.storageKey, mimeType: file.mimeType, sizeBytes: file.sizeBytes },
      rangeHeader,
    );
  }

  private async streamFromR2(
    file: RecordingObject,
    rangeHeader: string | undefined,
  ): Promise<RecordingPlaybackResult> {
    const mime = recordingPlaybackMime(file.mimeType);
    const totalSize = await this.resolveObjectSize(file);
    if (totalSize == null || totalSize <= 0) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    const parsed = parseSingleByteRange(rangeHeader, totalSize);
    if (parsed.kind === 'unsatisfiable') {
      return { kind: 'unsatisfiable', totalSize };
    }
    if (parsed.kind === 'range') {
      return this.streamR2Range(file.storageKey, mime, totalSize, parsed.start, parsed.end);
    }
    return this.streamR2Full(file.storageKey, mime, totalSize);
  }

  private async resolveObjectSize(file: RecordingObject): Promise<number | null> {
    const stored = toSafeByteLength(file.sizeBytes);
    if (stored != null && stored > 0) return stored;
    const head = await this.r2
      .ensureS3()
      .send(new HeadObjectCommand({ Bucket: this.r2.bucket, Key: file.storageKey }));
    const headed = toSafeByteLength(head.ContentLength);
    return headed != null && headed > 0 ? headed : null;
  }

  private async streamR2Full(
    storageKey: string,
    mime: string,
    totalSize: number,
  ): Promise<RecordingPlaybackResult> {
    const object = await this.getR2Object({ Key: storageKey });
    const size = toSafeByteLength(object.contentLength) ?? totalSize;
    if (size <= 0) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    return {
      kind: 'stream',
      status: 200,
      headers: fullRecordingHeaders(mime, size),
      file: recordingStreamFile(object.body, mime, size),
    };
  }

  private async streamR2Range(
    storageKey: string,
    mime: string,
    totalSize: number,
    start: number,
    end: number,
  ): Promise<RecordingPlaybackResult> {
    try {
      const object = await this.getR2Object({
        Key: storageKey,
        Range: r2ByteRangeHeader({ start, end }),
      });
      const length = end - start + 1;
      return {
        kind: 'stream',
        status: 206,
        headers: partialRecordingHeaders(mime, start, end, totalSize),
        file: recordingStreamFile(object.body, mime, length),
      };
    } catch (error) {
      if (isS3RangeNotSatisfiable(error)) {
        return { kind: 'unsatisfiable', totalSize };
      }
      throw error;
    }
  }

  private async getR2Object(input: {
    Key: string;
    Range?: string;
  }): Promise<{ body: Readable; contentLength: number | undefined }> {
    const object = await this.r2.ensureS3().send(
      new GetObjectCommand({
        Bucket: this.r2.bucket,
        Key: input.Key,
        Range: input.Range,
      }),
    );
    if (!object.Body) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    return { body: object.Body as Readable, contentLength: object.ContentLength };
  }
}
