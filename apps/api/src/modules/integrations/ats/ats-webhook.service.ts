import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AtsCallRealtimePublisher } from './ats-call-realtime.publisher';
import { AtsCallRecordingEnqueueService } from './ats-call-recording-enqueue.service';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import { AtsCallService } from './ats-call.service';
import { AtsProviderConfig } from './ats-provider.config';
import { parseAtsWebhookBody } from './ats-webhook-body.parse';
import { ATS_WEBHOOK_SUCCESS } from './ats.constants';
import type { AtsWebhookPayload, AtsWebhookSuccessResponse } from './ats.types';

@Injectable()
export class AtsWebhookService {
  private readonly logger = new Logger(AtsWebhookService.name);

  constructor(
    private readonly config: AtsProviderConfig,
    private readonly callService: AtsCallService,
    private readonly callRedirectService: AtsCallRedirectService,
    private readonly callRealtimePublisher: AtsCallRealtimePublisher,
    private readonly recordingEnqueue: AtsCallRecordingEnqueueService,
  ) {}

  async handleWebhook(
    key: string | undefined,
    body: Record<string, unknown>,
  ): Promise<AtsWebhookSuccessResponse> {
    this.assertApiKey(key);
    const payload = this.parseBody(body);
    await this.callService.ingestCallEvent(payload);
    await this.publishIncomingSafely(payload);
    await this.enqueueRecordingSafely(payload);
    const redirectCall = await this.callRedirectService.resolveRedirectCall(payload);
    if (!redirectCall) {
      return ATS_WEBHOOK_SUCCESS;
    }
    return { status: 'success', redirect_call: redirectCall };
  }

  private async publishIncomingSafely(payload: AtsWebhookPayload): Promise<void> {
    try {
      await this.callRealtimePublisher.publishIncomingStart(payload);
    } catch (err) {
      this.logger.error({
        event: 'ats_incoming_call_sse_failed',
        uid: payload.uid,
        error: String(err),
      });
    }
  }

  private async enqueueRecordingSafely(payload: AtsWebhookPayload): Promise<void> {
    try {
      await this.recordingEnqueue.enqueueAfterWebhook(payload);
    } catch (err) {
      this.logger.error({
        event: 'ats_recording_enqueue_failed',
        uid: payload.uid,
        error: String(err),
      });
    }
  }

  private assertApiKey(key: string | undefined): void {
    if (!this.config.isConfigured()) {
      throw new ServiceUnavailableException('ATS integration is not configured');
    }
    const provided = typeof key === 'string' ? key.trim() : '';
    if (!provided || provided !== this.config.apiKey) {
      throw new UnauthorizedException('Invalid ATS API key');
    }
  }

  private parseBody(body: Record<string, unknown>) {
    try {
      return parseAtsWebhookBody(body);
    } catch {
      throw new BadRequestException('uid is required');
    }
  }
}
