import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AtsCallRedirectService } from './ats-call-redirect.service';
import { AtsLeadIngestService } from './ats-lead-ingest.service';
import { AtsProviderConfig } from './ats-provider.config';
import { parseAtsWebhookBody } from './ats-webhook-body.parse';
import { ATS_WEBHOOK_SUCCESS } from './ats.constants';
import type { AtsWebhookSuccessResponse } from './ats.types';

@Injectable()
export class AtsWebhookService {
  constructor(
    private readonly config: AtsProviderConfig,
    private readonly leadIngestService: AtsLeadIngestService,
    private readonly callRedirectService: AtsCallRedirectService,
  ) {}

  async handleWebhook(
    key: string | undefined,
    body: Record<string, unknown>,
  ): Promise<AtsWebhookSuccessResponse> {
    this.assertApiKey(key);
    const payload = this.parseBody(body);
    await this.leadIngestService.ingestCallEvent(payload);
    const redirectCall = await this.callRedirectService.resolveRedirectCall(payload);
    if (!redirectCall) {
      return ATS_WEBHOOK_SUCCESS;
    }
    return { status: 'success', redirect_call: redirectCall };
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
