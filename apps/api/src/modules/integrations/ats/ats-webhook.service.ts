import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AtsCallRealtimePublisher, type AtsCallIngestMeta } from './ats-call-realtime.publisher';
import { AtsCallRecordingEnqueueService } from './ats-call-recording-enqueue.service';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import { AtsCallService } from './ats-call.service';
import { AtsProviderConfig } from './ats-provider.config';
import { parseAtsWebhookBody } from './ats-webhook-body.parse';
import { shouldEnqueueCallRecording } from './ats-call-recording-should-enqueue';
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
    const ingest = await this.callService.ingestCallEvent(payload);
    await this.publishLifecycleSafely(payload, ingest);
    await this.enqueueRecordingSafely(payload, ingest);
    const redirectCall = await this.callRedirectService.resolveRedirectCall(payload);
    if (!redirectCall) {
      return ATS_WEBHOOK_SUCCESS;
    }
    return { redirect_call: redirectCall };
  }

  private async publishLifecycleSafely(
    payload: AtsWebhookPayload,
    ingest: AtsCallIngestMeta,
  ): Promise<void> {
    try {
      await this.callRealtimePublisher.publishAfterWebhook(payload, ingest);
    } catch (err) {
      this.logger.error({
        event: 'ats_call_sse_failed',
        uid: payload.uid,
        error: String(err),
      });
    }
  }

  private async enqueueRecordingSafely(
    payload: AtsWebhookPayload,
    ingest: AtsCallIngestMeta,
  ): Promise<void> {
    if (!shouldEnqueueRecordingSideEffect(payload, ingest)) return;
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

export function shouldEnqueueRecordingSideEffect(
  payload: AtsWebhookPayload,
  ingest: AtsCallIngestMeta,
): boolean {
  if (!shouldEnqueueCallRecording(payload)) return false;
  return ingest.stateTransitionApplied || ingest.isFirstSeen;
}
