import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqualStr } from '../../../common/utils/crypto';
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
  private readonly logger = new Logger(MetaWebhookService.name);

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
    if (!normalizedToken || !timingSafeEqualStr(normalizedToken, this.config.webhookVerifyToken)) {
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

    // Fail closed: an unset app secret must not turn this public endpoint into an unauthenticated
    // lead ingest. Meta retries 503, so a fixed configuration recovers the missed deliveries.
    if (configuredSecrets.length === 0) {
      this.logger.error(
        'Rejecting Meta webhook delivery: neither META_APP_SECRET nor META_INSTAGRAM_APP_SECRET is configured',
      );
      throw new ServiceUnavailableException('Webhook signature verification is not configured');
    }

    const rawBody = req.rawBody;
    if (!rawBody || !verifyMetaWebhookSignatureAny(rawBody, signatureHeader, configuredSecrets)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const messages = parseMetaInboundMessages(body);
    for (const message of messages) {
      await this.leadIngestService.ingestMessage(message);
    }
  }
}
