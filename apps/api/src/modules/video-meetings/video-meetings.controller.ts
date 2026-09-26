import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VIDEO_MEETINGS_MODULE } from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import {
  AttachVideoMeetingEntityLinkDto,
  CreateVideoMeetingDto,
  ListVideoMeetingsQueryDto,
} from './dto/video-meetings.dto';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsService } from './video-meetings.service';

@ApiTags('Video Meetings')
@ApiBearerAuth()
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings')
export class VideoMeetingsController {
  constructor(private readonly videoMeetingsService: VideoMeetingsService) {}

  @Post()
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create an instant standalone video meeting (metadata only)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateVideoMeetingDto) {
    return this.videoMeetingsService.create(user, body);
  }

  @Get()
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List video meetings accessible to the caller' })
  list(@CurrentUser() user: CurrentUserPayload, @Query() query: ListVideoMeetingsQueryDto) {
    return this.videoMeetingsService.list(user, query);
  }

  @Get('history')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'List ended video meetings (history)' })
  history(@CurrentUser() user: CurrentUserPayload, @Query() query: ListVideoMeetingsQueryDto) {
    return this.videoMeetingsService.history(user, query);
  }

  @Get(':id')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Get video meeting card / detail' })
  getCard(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoMeetingsService.getCard(user, id);
  }

  @Post(':id/start')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Start meeting (metadata session; no LiveKit call)' })
  start(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoMeetingsService.start(user, id);
  }

  @Post(':id/end')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'End an active video meeting (soft)' })
  end(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoMeetingsService.end(user, id);
  }

  @Post(':id/cancel')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Cancel a meeting that was never held (soft)' })
  cancel(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoMeetingsService.cancel(user, id);
  }

  @Post(':id/entity-links')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Attach Deal/Project/Product/Contact link (auth re-check)' })
  attachEntityLink(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AttachVideoMeetingEntityLinkDto,
  ) {
    return this.videoMeetingsService.attachEntityLink(user, id, body);
  }

  @Delete(':id/entity-links/:linkId')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Detach a business entity link' })
  detachEntityLink(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('linkId', ParseUUIDPipe) linkId: string,
  ) {
    return this.videoMeetingsService.detachEntityLink(user, id, linkId);
  }
}
