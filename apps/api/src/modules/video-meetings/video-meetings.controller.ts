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
  CreateVideoMeetingInviteDto,
  ListVideoMeetingsQueryDto,
  VideoMeetingTokenRequestDto,
} from './dto/video-meetings.dto';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VideoMeetingsService } from './video-meetings.service';

@ApiTags('Video Meetings')
@ApiBearerAuth()
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings')
export class VideoMeetingsController {
  constructor(
    private readonly videoMeetingsService: VideoMeetingsService,
    private readonly invitesService: VideoMeetingsInvitesService,
    private readonly admissionService: VideoMeetingsAdmissionService,
  ) {}

  @Post()
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create an instant standalone video meeting' })
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
  @ApiOperation({
    summary: 'Start meeting; ensure LiveKit room when configured',
  })
  start(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoMeetingsService.start(user, id);
  }

  @Post(':id/token')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Mint LiveKit join token for an admitted employee' })
  employeeToken(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VideoMeetingTokenRequestDto,
  ) {
    return this.admissionService.employeeToken(user, id, body.roomName);
  }

  @Post(':id/invites')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create guest invite; raw token returned once' })
  createInvite(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateVideoMeetingInviteDto,
  ) {
    return this.invitesService.create(user, id, new Date(body.expiresAt));
  }

  @Get(':id/invites')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'List invites (no raw secrets)' })
  listInvites(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.invitesService.list(user, id);
  }

  @Post(':id/invites/:inviteId/revoke')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Revoke a guest invite' })
  revokeInvite(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
  ) {
    return this.invitesService.revoke(user, id, inviteId);
  }

  @Get(':id/waiting')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'List waiting guest participants' })
  listWaiting(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.admissionService.listWaiting(user, id);
  }

  @Post(':id/participants/:participantId/admit')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Admit a waiting guest' })
  admit(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.admissionService.admit(user, id, participantId);
  }

  @Post(':id/participants/:participantId/reject')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Reject a waiting guest' })
  reject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    return this.admissionService.reject(user, id, participantId);
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
  @ApiOperation({ summary: 'Attach Deal/Project/Product/Contact link' })
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
