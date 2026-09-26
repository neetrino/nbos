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
  VideoMeetingConsentDecisionBodyDto,
  VideoMeetingLifecycleConfirmDto,
  VideoMeetingTokenRequestDto,
} from './dto/video-meetings.dto';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsInvitesService } from './video-meetings-invites.service';
import { VideoMeetingsRecordingPlaybackService } from './video-meetings-recording-playback.service';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
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
    private readonly recordingService: VideoMeetingsRecordingService,
    private readonly consentService: VideoMeetingsConsentService,
    private readonly playbackService: VideoMeetingsRecordingPlaybackService,
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

  @Get('consent/notice')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Recording notice version + placeholder copy' })
  consentNotice() {
    return this.consentService.getNotice();
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
  @ApiOperation({
    summary: 'End an active video meeting (soft); Calendar cancel only with explicit confirm',
  })
  end(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: VideoMeetingLifecycleConfirmDto,
  ) {
    return this.videoMeetingsService.end(user, id, body);
  }

  @Post(':id/cancel')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Cancel a meeting never held; Calendar cancel only with explicit confirm',
  })
  cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: VideoMeetingLifecycleConfirmDto,
  ) {
    return this.videoMeetingsService.cancel(user, id, body);
  }

  @Post(':id/recording/start')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Start consented room composite + per-participant audio recording' })
  startRecording(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.recordingService.start(user, id);
  }

  @Post(':id/recording/stop')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Stop active recording and Drive-finalize verified objects' })
  stopRecording(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.recordingService.stop(user, id);
  }

  @Get(':id/recording')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Latest recording group status (no keys or playback URLs)' })
  getRecording(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.videoMeetingsService.getRecordingStatus(user, id);
  }

  @Get(':id/recording/playback')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({
    summary: 'Short-lived signed URL for composite playback (host/owner/participant only)',
  })
  getRecordingPlayback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.playbackService.getCompositePlayback(user, id);
  }

  @Post(':id/consent')
  @RequirePermission(VIDEO_MEETINGS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Employee records own recording consent decision' })
  async decideConsent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: VideoMeetingConsentDecisionBodyDto,
  ) {
    const result = await this.consentService.decideForEmployee(user, id, body.decision);
    if (body.decision === 'REVOKED' || body.decision === 'DECLINED') {
      await this.recordingService.stopParticipantAudioOnWithdrawal(id, result.participantId);
    }
    return result;
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
