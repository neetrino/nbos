import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import { MetaProviderConfig } from './meta-provider.config';
import type { MetaMessagingWebhookBody } from './meta.types';
import {
  assertSafeMetaHubChallenge,
  normalizeHttpRequestParam,
  parseMetaInboundMessages,
  verifyMetaWebhookSignature,
  type HttpRequestParam,
} from './meta-webhook.helpers';

type RawBodyRequest = { rawBody?: Buffer };

@Injectable()
export class MetaWebhookService {
  constructor(
    private readonly config: MetaProviderConfig,
    private readonly leadIngestService: MetaLeadIngestService,
  ) {}

  verifySubscription(
    mode: HttpRequestParam,
    token: HttpRequestParam,
    challenge: HttpRequestParam,
  ): string {
    const normalizedMode = normalizeHttpRequestParam(mode);
    const normalizedToken = normalizeHttpRequestParam(token);
    const normalizedChallenge = normalizeHttpRequestParam(challenge);

    if (normalizedMode !== 'subscribe' || !normalizedChallenge) {
      throw new ForbiddenException('Invalid webhook verification request');
    }
    if (!this.config.isWebhookVerifyConfigured()) {
      throw new ForbiddenException('Webhook verify token is not configured');
    }
    if (normalizedToken !== this.config.webhookVerifyToken) {
      throw new ForbiddenException('Invalid verify token');
    }
    try {
      return assertSafeMetaHubChallenge(normalizedChallenge);
    } catch {
      throw new ForbiddenException('Invalid webhook verification request');
    }
  }

  async handleWebhook(
    req: RawBodyRequest,
    signatureHeader: string | undefined,
    body: MetaMessagingWebhookBody,
  ): Promise<void> {
    if (this.config.appSecret) {
      const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(body));
      if (!verifyMetaWebhookSignature(rawBody, signatureHeader, this.config.appSecret)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const messages = parseMetaInboundMessages(body);
    for (const message of messages) {
      await this.leadIngestService.ingestMessage(message);
    }
  }
}
