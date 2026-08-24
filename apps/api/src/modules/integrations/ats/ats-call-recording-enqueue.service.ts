import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../../database.module';
import { AtsCallRecordingQueueService } from './ats-call-recording-queue.service';
import { shouldEnqueueCallRecording } from './ats-call-recording-should-enqueue';
import type { AtsWebhookPayload } from './ats.types';

const ENQUEUE_SELECT = {
  id: true,
  uid: true,
  recordingStatus: true,
  recordingFileAssetId: true,
} as const;

@Injectable()
export class AtsCallRecordingEnqueueService {
  private readonly logger = new Logger(AtsCallRecordingEnqueueService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly queue: AtsCallRecordingQueueService,
  ) {}

  async enqueueAfterWebhook(payload: AtsWebhookPayload): Promise<void> {
    if (!shouldEnqueueCallRecording(payload)) return;

    const call = await this.prisma.atsCallEvent.findUnique({
      where: { uid: payload.uid },
      select: ENQUEUE_SELECT,
    });
    if (!call) {
      this.logger.warn({ event: 'ats_recording_enqueue_missing_call', uid: payload.uid });
      return;
    }
    if (call.recordingStatus === 'READY' && call.recordingFileAssetId) return;

    if (call.recordingStatus !== 'DOWNLOADING') {
      await this.prisma.atsCallEvent.updateMany({
        where: { id: call.id, recordingStatus: { not: 'READY' } },
        data: { recordingStatus: 'PENDING' },
      });
    }

    const queued = await this.queue.enqueueDownload({ callId: call.id, uid: call.uid });
    if (queued) {
      this.logger.log({ event: 'ats_recording_enqueued', uid: payload.uid, callId: call.id });
      return;
    }

    this.logger.error({
      event: 'ats_recording_enqueue_skipped',
      uid: payload.uid,
      callId: call.id,
    });
  }
}
