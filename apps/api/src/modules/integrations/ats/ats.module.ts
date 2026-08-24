import { Module } from '@nestjs/common';
import { DriveModule } from '../../drive/drive.module';
import { RealtimeModule } from '../../realtime/realtime.module';
import { AtsCallContextResolver } from './ats-call-context.resolver';
import { AtsCallRealtimePublisher } from './ats-call-realtime.publisher';
import { AtsCallbackClient } from './ats-callback.client';
import { AtsCallRecordClient } from './ats-call-record.client';
import { NodeAtsRecordingDnsResolver } from './ats-recording-dns';
import { AtsRecordingHttpTransport } from './ats-recording-http.transport';
import { AtsRecordingSafeDownloadService } from './ats-recording-safe-download.service';
import { AtsRecordingUrlPolicy } from './ats-recording-url-policy.service';
import { AtsCallRecordingDownloadService } from './ats-call-recording-download.service';
import { AtsCallRecordingReprocessService } from './ats-call-recording-reprocess.service';
import { AtsCallRecordingEnqueueService } from './ats-call-recording-enqueue.service';
import { AtsCallRecordingQueueService } from './ats-call-recording-queue.service';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import { AtsCallService } from './ats-call.service';
import { AtsController } from './ats.controller';
import { AtsProviderConfig } from './ats-provider.config';
import { AtsWebhookService } from './ats-webhook.service';

@Module({
  imports: [DriveModule, RealtimeModule],
  controllers: [AtsController],
  providers: [
    AtsProviderConfig,
    AtsWebhookService,
    AtsCallService,
    AtsCallContextResolver,
    AtsCallRedirectService,
    AtsCallRealtimePublisher,
    NodeAtsRecordingDnsResolver,
    AtsRecordingUrlPolicy,
    AtsRecordingHttpTransport,
    AtsRecordingSafeDownloadService,
    AtsCallRecordClient,
    AtsCallbackClient,
    AtsCallRecordingQueueService,
    AtsCallRecordingEnqueueService,
    AtsCallRecordingDownloadService,
    AtsCallRecordingReprocessService,
  ],
  exports: [
    AtsProviderConfig,
    AtsCallRecordClient,
    AtsCallbackClient,
    AtsCallRecordingQueueService,
    AtsCallRecordingDownloadService,
    AtsCallRecordingReprocessService,
    AtsCallRealtimePublisher,
  ],
})
export class AtsModule {}
