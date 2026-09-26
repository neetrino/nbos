import { Module } from '@nestjs/common';
import { VideoMeetingsController } from './video-meetings.controller';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';
import { VideoMeetingsService } from './video-meetings.service';

@Module({
  controllers: [VideoMeetingsController],
  providers: [VideoMeetingsService, VideoMeetingsFeatureService, VideoMeetingsFeatureGuard],
  exports: [VideoMeetingsService, VideoMeetingsFeatureService],
})
export class VideoMeetingsModule {}
