import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VIDEO_MEETINGS_MODULE } from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { PostVideoMeetingMessageDto } from './dto/video-meetings-thread.dto';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsThreadService } from './video-meetings-thread.service';

/** Employee room thread: persisted messages + session markers + recording cards. */
@ApiTags('Video Meetings')
@ApiBearerAuth()
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings')
export class VideoMeetingsThreadController {
  constructor(private readonly threadService: VideoMeetingsThreadService) {}

  @Get(':id/thread')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Room thread: messages, session markers, recording cards' })
  getThread(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.threadService.getThread(user, id);
  }

  @Post(':id/messages')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Post a plain-text message to the room thread' })
  postMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PostVideoMeetingMessageDto,
  ) {
    return this.threadService.postMessage(user, id, body.body);
  }
}
