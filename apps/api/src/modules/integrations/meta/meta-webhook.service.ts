import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import { MetaProviderConfig } from './meta-provider.config';
import type { MetaMessagingWebhookBody } from './meta.types';
import {
  assertSafeMetaHubChallenge,
  collectConfiguredWebhookSecrets,
  normalizeHttpRequestParam,
  parseMetaInboundMessages,
  verifyMetaWebhookSignatureAny,
  type HttpRequestParam,
} from './meta-webhook.helpers';
import type { MetaWebhookRequest } from './meta-webhook.types';

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
    req: MetaWebhookRequest,
    signatureHeader: string | undefined,
    body: MetaMessagingWebhookBody,
  ): Promise<void> {
    const configuredSecrets = collectConfiguredWebhookSecrets([
      this.config.appSecret,
      this.config.instagramAppSecret,
    ]);

    // Optional in local dev when Meta env is unset; verify when any secret is configured.
    if (configuredSecrets.length > 0) {
      const rawBody = req.rawBody;
      if (!rawBody || !verifyMetaWebhookSignatureAny(rawBody, signatureHeader, configuredSecrets)) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const messages = parseMetaInboundMessages(body);
    for (const message of messages) {
      await this.leadIngestService.ingestMessage(message);
    }
  }
}
