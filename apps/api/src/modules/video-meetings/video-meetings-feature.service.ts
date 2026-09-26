import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isVideoMeetingsFeatureEnabled } from '@nbos/shared';
import {
  VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN,
  VIDEO_MEETINGS_FEATURE_ENV_KEY,
} from './video-meetings.constants';

/**
 * Resolves Video Meetings V1 feature availability.
 * Default OFF via shared `isVideoMeetingsFeatureEnabled`; tests may inject an override token.
 */
@Injectable()
export class VideoMeetingsFeatureService {
  constructor(
    private readonly config: ConfigService,
    @Optional()
    @Inject(VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN)
    private readonly enabledOverride?: boolean,
  ) {}

  isEnabled(): boolean {
    if (typeof this.enabledOverride === 'boolean') {
      return this.enabledOverride;
    }
    return isVideoMeetingsFeatureEnabled(
      this.config.get<string | undefined>(VIDEO_MEETINGS_FEATURE_ENV_KEY),
    );
  }

  /** When the flag is off, hide the module surface with 404 (not a half-open API). */
  assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new NotFoundException();
    }
  }
}
