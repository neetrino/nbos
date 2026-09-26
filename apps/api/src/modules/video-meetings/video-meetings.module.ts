import { Module } from '@nestjs/common';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { VideoMeetingsController } from './video-meetings.controller';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';
import { VideoMeetingsGuestController } from './video-meetings-guest.controller';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VideoMeetingsLivekitService } from './video-meetings-livekit.service';
import { VideoMeetingsService } from './video-meetings.service';

@Module({
  controllers: [VideoMeetingsController, VideoMeetingsGuestController],
  providers: [
    VideoMeetingsService,
    VideoMeetingsFeatureService,
    VideoMeetingsFeatureGuard,
    VideoMeetingsLivekitService,
    VideoMeetingsInvitesService,
    VideoMeetingsAdmissionService,
  ],
  exports: [VideoMeetingsService, VideoMeetingsFeatureService],
})
export class VideoMeetingsModule {}
