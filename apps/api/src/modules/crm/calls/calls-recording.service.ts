import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, Inject, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { Readable } from 'node:stream';
import type { CurrentUserPayload } from '../../../common/decorators';
import { PRISMA_TOKEN } from '../../../database.module';
import { findAccessibleFileAssetStorage } from '../../drive/drive-accessible-file.op';
import { DriveAccessContextService } from '../../drive/drive-access-context.service';
import { DriveR2Client } from '../../drive/drive-r2.client';
import { recordingPlaybackMime } from '../../integrations/ats/ats-recording-mime';
import { CallAccessPolicyService } from './call-access-policy.service';
import { callAccessActorFromUser } from './call-access.types';
import { assertCanPlayCallRecording } from './calls-recording-play';
import { CALL_RECORDING_UNAVAILABLE_MESSAGE } from './calls.constants';

const PLAYBACK_SELECT = {
  id: true,
  recordingStatus: true,
  recordingFileAssetId: true,
} as const;

type ReadyRecording = { recordingFileAssetId: string };

@Injectable()
export class CallsRecordingService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
    private readonly access: CallAccessPolicyService,
    private readonly driveAccess: DriveAccessContextService,
  ) {}

  async streamRecording(callId: string, user: CurrentUserPayload): Promise<StreamableFile> {
    const actor = callAccessActorFromUser(user);
    await this.access.assertCanAccessCall(actor, callId);
    assertCanPlayCallRecording(user.permissions);
    const recording = await this.loadReadyRecording(callId);
    return this.streamAuthorizedRecording(recording.recordingFileAssetId, user);
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
  ): Promise<StreamableFile> {
    const driveAccess = await this.driveAccess.fromRequest(user, user.permissions.DRIVE_VIEW);
    const file = await findAccessibleFileAssetStorage(this.prisma, fileAssetId, driveAccess);
    if (!file?.storageKey) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    return this.streamFromR2(file.storageKey, file.mimeType);
  }

  private async streamFromR2(storageKey: string, mimeType: string | null): Promise<StreamableFile> {
    const mime = recordingPlaybackMime(mimeType);
    const object = await this.r2.ensureS3().send(
      new GetObjectCommand({
        Bucket: this.r2.bucket,
        Key: storageKey,
        ResponseContentType: mime,
        ResponseContentDisposition: 'inline',
      }),
    );
    if (!object.Body) {
      throw new NotFoundException(CALL_RECORDING_UNAVAILABLE_MESSAGE);
    }
    return new StreamableFile(object.Body as Readable, {
      type: mime,
      disposition: 'inline',
    });
  }
}
