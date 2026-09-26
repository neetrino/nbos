import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WebhookReceiver } from 'livekit-server-sdk';
import { Public } from '../../common/decorators';
import { LIVEKIT_API_KEY_ENV_KEY, LIVEKIT_API_SECRET_ENV_KEY } from './video-meetings.constants';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsRecordingWebhookService } from './video-meetings-recording-webhook.service';

type RawBodyRequest = {
  rawBody?: Buffer;
  body?: unknown;
};

/**
 * LiveKit webhook ingress — authenticity via SDK WebhookReceiver only.
 * Feature flag still gates the route (404 when off).
 */
@ApiExcludeController()
@UseGuards(VideoMeetingsFeatureGuard)
@Controller('video-meetings/livekit')
export class VideoMeetingsRecordingWebhookController {
  private readonly logger = new Logger(VideoMeetingsRecordingWebhookController.name);
  private receiver: WebhookReceiver | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly webhooks: VideoMeetingsRecordingWebhookService,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest,
    @Headers('authorization') authorization?: string,
  ): Promise<{ ok: true }> {
    const body = this.readBody(req);
    const event = await this.verify(body, authorization);
    await this.webhooks.handleEvent(event);
    return { ok: true };
  }

  private async verify(body: string, authorization: string | undefined) {
    const receiver = this.getReceiver();
    try {
      return await receiver.receive(body, authorization);
    } catch (error) {
      this.logger.warn(`LiveKit webhook rejected: ${String(error)}`);
      throw new UnauthorizedException('Invalid LiveKit webhook');
    }
  }

  private getReceiver(): WebhookReceiver {
    if (this.receiver) return this.receiver;
    const apiKey = this.config.get<string>(LIVEKIT_API_KEY_ENV_KEY)?.trim();
    const apiSecret = this.config.get<string>(LIVEKIT_API_SECRET_ENV_KEY)?.trim();
    if (!apiKey || !apiSecret) {
      throw new BadRequestException('LiveKit webhook verification is not configured');
    }
    this.receiver = new WebhookReceiver(apiKey, apiSecret);
    return this.receiver;
  }

  private readBody(req: RawBodyRequest): string {
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      return req.rawBody.toString('utf8');
    }
    if (typeof req.body === 'string') return req.body;
    if (req.body != null) return JSON.stringify(req.body);
    throw new BadRequestException('Empty webhook body');
  }
}
