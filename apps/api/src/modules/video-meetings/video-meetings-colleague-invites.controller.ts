import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VIDEO_MEETINGS_MODULE } from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { InviteVideoMeetingColleaguesDto } from './dto/video-meetings.dto';
import { VideoMeetingsColleagueInvitesService } from './video-meetings-colleague-invites.service';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';

@ApiTags('Video Meetings')
@ApiBearerAuth()
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings')
export class VideoMeetingsColleagueInvitesController {
  constructor(private readonly colleagueInvitesService: VideoMeetingsColleagueInvitesService) {}

  @Get('colleague-invites/pending')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Pending colleague invites for caller' })
  listPending(@CurrentUser() user: CurrentUserPayload) {
    return this.colleagueInvitesService.listPending(user);
  }

  @Post(':id/colleague-invites')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Invite NBOS colleagues by employee id' })
  invite(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: InviteVideoMeetingColleaguesDto,
  ) {
    return this.colleagueInvitesService.invite(user, id, body.employeeIds);
  }

  @Get(':id/colleague-invites')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'List colleague invites for a meeting' })
  listForMeeting(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.colleagueInvitesService.listForMeeting(user, id);
  }

  @Post(':id/colleague-invites/accept')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Accept colleague invite' })
  accept(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.colleagueInvitesService.accept(user, id);
  }

  @Post(':id/colleague-invites/decline')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Decline colleague invite' })
  decline(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.colleagueInvitesService.decline(user, id);
  }
}
