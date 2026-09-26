import { CanActivate, Injectable } from '@nestjs/common';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';

/** Returns 404 for all Video Meetings routes when the V1 feature flag is off. */
@Injectable()
export class VideoMeetingsFeatureGuard implements CanActivate {
  constructor(private readonly feature: VideoMeetingsFeatureService) {}

  canActivate(): boolean {
    this.feature.assertEnabled();
    return true;
  }
}
