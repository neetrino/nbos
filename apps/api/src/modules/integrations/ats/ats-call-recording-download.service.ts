import { unlink } from 'node:fs/promises';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { DriveR2Client } from '../../drive/drive-r2.client';
import { DriveService } from '../../drive/drive.service';
import { AtsCallRecordClient } from './ats-call-record.client';
import {
  isAtsRecordingPermanentError,
  isAtsRecordingTransientError,
} from './ats-call-recording.errors';
import type { AtsCallRecordingJobPayload } from './ats-call-recording.constants';
import { isLastRecordingAttempt } from './ats-call-recording-job-id';
import { storeAtsCallRecording } from './ats-call-recording-store';

const CALL_SELECT = {
  id: true,
  uid: true,
  recordLink: true,
  leadId: true,
  contactId: true,
  answeredEmployeeId: true,
  responsibleEmployeeId: true,
  recordingStatus: true,
  recordingFileAssetId: true,
} as const;

@Injectable()
export class AtsCallRecordingDownloadService {
  private readonly logger = new Logger(AtsCallRecordingDownloadService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly client: AtsCallRecordClient,
    private readonly drive: DriveService,
    private readonly r2: DriveR2Client,
    private readonly config: ConfigService,
  ) {}

  async processJob(
    payload: AtsCallRecordingJobPayload,
    attemptsMade = 0,
    maxAttempts?: number,
  ): Promise<void> {
    const call = await this.prisma.atsCallEvent.findUnique({
      where: { id: payload.callId },
      select: CALL_SELECT,
    });
    if (!call || call.uid !== payload.uid) {
      this.logger.warn({ event: 'ats_recording_job_call_mismatch', ...payload });
      return;
    }
    if (call.recordingStatus === 'READY' && call.recordingFileAssetId) return;

    await this.prisma.atsCallEvent.update({
      where: { id: call.id },
      data: { recordingStatus: 'DOWNLOADING' },
    });

    let tmpPath: string | null = null;
    try {
      const download = await this.client.downloadRecording(call.uid, call.recordLink);
      tmpPath = download.tmpPath;
      const fileAssetId = await storeAtsCallRecording({
        prisma: this.prisma,
        drive: this.drive,
        r2: this.r2,
        config: this.config,
        call,
        download,
      });
      await this.markReady(call.id, fileAssetId);
    } catch (error) {
      await this.handleFailure(call.id, error, attemptsMade, maxAttempts);
    } finally {
      if (tmpPath) await unlink(tmpPath).catch(() => undefined);
    }
  }

  async markFailed(callId: string): Promise<void> {
    await this.prisma.atsCallEvent.updateMany({
      where: { id: callId, recordingStatus: { not: 'READY' } },
      data: { recordingStatus: 'FAILED' },
    });
  }

  private async markReady(callId: string, recordingFileAssetId: string): Promise<void> {
    await this.prisma.atsCallEvent.update({
      where: { id: callId },
      data: { recordingStatus: 'READY', recordingFileAssetId },
    });
  }

  private async handleFailure(
    callId: string,
    error: unknown,
    attemptsMade: number,
    maxAttempts?: number,
  ): Promise<void> {
    this.logger.error({
      event: 'ats_recording_download_failed',
      callId,
      errorName: error instanceof Error ? error.name : 'Error',
      errorCode: error instanceof Error ? error.message : 'unknown',
    });
    if (isAtsRecordingPermanentError(error) || isLastRecordingAttempt(attemptsMade, maxAttempts)) {
      await this.markFailed(callId);
      if (isAtsRecordingPermanentError(error)) return;
    }
    if (isAtsRecordingTransientError(error) || error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}
