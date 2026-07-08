import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { MetaLeadIngestService } from './meta-lead-ingest.service';
import { MetaProviderConfig } from './meta-provider.config';
import type { MetaMessagingWebhookBody } from './meta.types';
import { parseMetaInboundMessages, verifyMetaWebhookSignature } from './meta-webhook.helpers';

type RawBodyRequest = { rawBody?: Buffer };

@Injectable()
export class MetaWebhookService {
  constructor(
    private readonly config: MetaProviderConfig,
    private readonly leadIngestService: MetaLeadIngestService,
  ) {}

  verifySubscription(
    mode: string | undefined,
    token: string | undefined,
    challenge: string | undefined,
  ): string {
    if (mode !== 'subscribe' || !challenge) {
      throw new ForbiddenException('Invalid webhook verification request');
    }
    if (!this.config.isWebhookVerifyConfigured()) {
      throw new ForbiddenException('Webhook verify token is not configured');
    }
    if (token !== this.config.webhookVerifyToken) {
      throw new ForbiddenException('Invalid verify token');
    }
    return challenge;
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
