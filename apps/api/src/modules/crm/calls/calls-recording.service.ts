import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Injectable, Inject, NotFoundException, StreamableFile } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import type { Readable } from 'node:stream';
import { PRISMA_TOKEN } from '../../../database.module';
import { DriveR2Client } from '../../drive/drive-r2.client';
import { assertCanViewCall } from './calls-access';
import { ATS_CALL_RECORDING_DEFAULT_MIME } from '../../integrations/ats/ats-call-recording.constants';

const PLAYBACK_SELECT = {
  id: true,
  leadId: true,
  contactId: true,
  dealId: true,
  recordingStatus: true,
  recordingFileAssetId: true,
} as const;

@Injectable()
export class CallsRecordingService {
  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly r2: DriveR2Client,
  ) {}

  async streamRecording(
    callId: string,
    permissions: Record<string, string>,
  ): Promise<StreamableFile> {
    const call = await this.prisma.atsCallEvent.findUnique({
      where: { id: callId },
      select: PLAYBACK_SELECT,
    });
    if (!call) {
      throw new NotFoundException(`Call ${callId} not found`);
    }
    assertCanViewCall(permissions, call);
    if (call.recordingStatus !== 'READY' || !call.recordingFileAssetId) {
      throw new NotFoundException('Call recording is not available');
    }

    const file = await this.prisma.fileAsset.findFirst({
      where: { id: call.recordingFileAssetId, deletedAt: null },
      select: { storageKey: true, mimeType: true },
    });
    if (!file?.storageKey) {
      throw new NotFoundException('Call recording is not available');
    }

    const object = await this.r2.ensureS3().send(
      new GetObjectCommand({
        Bucket: this.r2.bucket,
        Key: file.storageKey,
        ResponseContentType: file.mimeType ?? ATS_CALL_RECORDING_DEFAULT_MIME,
        ResponseContentDisposition: 'inline',
      }),
    );
    if (!object.Body) {
      throw new NotFoundException('Call recording is not available');
    }

    const mime = file.mimeType ?? ATS_CALL_RECORDING_DEFAULT_MIME;
    return new StreamableFile(object.Body as Readable, {
      type: mime,
      disposition: 'inline',
    });
  }
}
