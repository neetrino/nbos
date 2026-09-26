import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { GuestConsentDto, GuestPrejoinDto, GuestTokenDto } from './dto/video-meetings.dto';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { VideoMeetingsConsentService } from './video-meetings-consent.service';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';
import { VideoMeetingsRecordingService } from './video-meetings-recording.service';
import { serializeGuestRecordingIndicator } from './video-meetings-recording.serializer';

/**
 * Guest surface — no NBOS employee session.
 * DECISION (rate limit): routes inherit the global APP_GUARD ThrottlerGuard
 * (ttl 60s / limit 100). No Video Meetings-specific limit number invented.
 */
@ApiTags('Video Meetings Guest')
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings/guest')
export class VideoMeetingsGuestController {
  constructor(
    private readonly admission: VideoMeetingsAdmissionService,
    private readonly consent: VideoMeetingsConsentService,
    private readonly recordings: VideoMeetingsRecordingService,
  ) {}

  @Post('prejoin')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Guest prejoin with invite secret + display name' })
  async prejoin(@Body() body: GuestPrejoinDto) {
    const result = await this.admission.guestPrejoin(body.inviteToken, body.displayName);
    assertSafeGuestPayload(result);
    return result;
  }

  @Post('token')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange invite for LiveKit JWT after host admission' })
  async token(@Body() body: GuestTokenDto) {
    const result = await this.admission.guestToken(body.inviteToken, body.roomName);
    assertSafeGuestPayload(result);
    return result;
  }

  @Get('consent/notice')
  @Public()
  @ApiOperation({ summary: 'Recording notice placeholder (pending legal approval)' })
  consentNotice() {
    const notice = this.consent.getNotice();
    assertSafeGuestPayload(notice);
    return notice;
  }

  @Post('consent')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Guest records own consent decision via invite secret' })
  async decideConsent(@Body() body: GuestConsentDto) {
    const result = await this.consent.decideForGuest(body.inviteToken, body.decision);
    if (body.decision === 'REVOKED' || body.decision === 'DECLINED') {
      const invite = await this.admission.resolveGuestMeetingId(body.inviteToken);
      if (invite) {
        await this.recordings.stopParticipantAudioOnWithdrawal(
          invite.meetingId,
          result.participantId,
        );
      }
    }
    assertSafeGuestPayload(result);
    return result;
  }

  @Post('recording-status')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Guest-visible recording indicator (status only)' })
  async recordingStatus(@Body() body: { inviteToken: string }) {
    const invite = await this.admission.resolveGuestMeetingId(body.inviteToken);
    if (!invite) {
      const empty = serializeGuestRecordingIndicator(null);
      assertSafeGuestPayload(empty);
      return empty;
    }
    const recording = await this.recordings.getActiveStatus(invite.meetingId);
    const payload = serializeGuestRecordingIndicator(recording);
    assertSafeGuestPayload(payload);
    return payload;
  }
}
