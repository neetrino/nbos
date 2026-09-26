import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { GuestPrejoinDto, GuestTokenDto } from './dto/video-meetings.dto';
import { VideoMeetingsAdmissionService } from './video-meetings-admission.service';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { assertSafeGuestPayload } from './video-meetings-guest-safety';

/**
 * Guest surface — no NBOS employee session.
 * DECISION (rate limit): routes inherit the global APP_GUARD ThrottlerGuard
 * (ttl 60s / limit 100). No Video Meetings-specific limit number invented.
 */
@ApiTags('Video Meetings Guest')
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings/guest')
export class VideoMeetingsGuestController {
  constructor(private readonly admission: VideoMeetingsAdmissionService) {}

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
}
