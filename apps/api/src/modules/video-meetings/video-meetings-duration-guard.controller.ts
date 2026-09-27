import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VIDEO_MEETINGS_MODULE } from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { VideoMeetingsDurationGuardService } from './video-meetings-duration-guard.service';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';

@ApiTags('Video Meetings')
@ApiBearerAuth()
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings')
export class VideoMeetingsDurationGuardController {
  constructor(private readonly guard: VideoMeetingsDurationGuardService) {}

  @Get(':id/duration-guard')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Continuation clock for a teammate in the live meeting' })
  state(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.guard.state(user, id);
  }

  @Post(':id/duration-guard/continue')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'A teammate accepts the next hour of the live meeting' })
  continueMeeting(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.guard.continue(user, id);
  }

  @Post(':id/duration-guard/expire')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'End the meeting when the continuation countdown has reached zero' })
  expire(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.guard.expireForTeammate(user, id);
  }
}
