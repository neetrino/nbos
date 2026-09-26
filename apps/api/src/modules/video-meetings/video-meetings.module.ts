import { Module } from '@nestjs/common';
import { DriveModule } from '../drive/drive.module';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import { VideoMeetingsController } from './video-meetings.controller';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';
import { VideoMeetingsGuestController } from './video-meetings-guest.controller';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { VideoMeetingsLivekitEgressClient } from './video-meetings-egress.client';
import {
  VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN,
  VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN,
} from './video-meetings-recording.constants';
import { VideoMeetingsRecordingFinalizeService } from './video-meetings-recording-finalize.service';
import { VideoMeetingsRecordingLifecycleService } from './video-meetings-recording-lifecycle.service';
import { VideoMeetingsRecordingObjectStoreService } from './video-meetings-recording-object-store';
import { VideoMeetingsRecordingPlaybackService } from './video-meetings-recording-playback.service';
import { VideoMeetingsRecordingReconcileService } from './video-meetings-recording-reconcile.service';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import { VideoMeetingsRecordingWebhookController } from './video-meetings-recording-webhook.controller';
import { VideoMeetingsRecordingWebhookService } from './video-meetings-recording-webhook.service';
import { VideoMeetingsService } from './video-meetings.service';

@Module({
  imports: [DriveModule],
  controllers: [
    VideoMeetingsController,
    VideoMeetingsGuestController,
    VideoMeetingsRecordingWebhookController,
  ],
  providers: [
    VideoMeetingsService,
    VideoMeetingsFeatureService,
    VideoMeetingsFeatureGuard,
    VideoMeetingsLivekitService,
    VideoMeetingsInvitesService,
    VideoMeetingsAdmissionService,
    VideoMeetingsConsentService,
    VideoMeetingsRecordingObjectStoreService,
    {
      provide: VIDEO_MEETINGS_RECORDING_OBJECT_STORE_TOKEN,
      useExisting: VideoMeetingsRecordingObjectStoreService,
    },
    VideoMeetingsLivekitEgressClient,
    {
      provide: VIDEO_MEETINGS_EGRESS_CLIENT_TOKEN,
      useExisting: VideoMeetingsLivekitEgressClient,
    },
    VideoMeetingsRecordingFinalizeService,
    VideoMeetingsRecordingReconcileService,
    VideoMeetingsRecordingPlaybackService,
    VideoMeetingsRecordingLifecycleService,
    VideoMeetingsRecordingService,
    VideoMeetingsRecordingWebhookService,
  ],
  exports: [VideoMeetingsService, VideoMeetingsFeatureService],
})
export class VideoMeetingsModule {}
