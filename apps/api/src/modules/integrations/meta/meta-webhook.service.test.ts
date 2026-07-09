import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { describe, expect, it, vi } from 'vitest';
import { MetaWebhookService } from './meta-webhook.service';
import type { MetaProviderConfig } from './meta-provider.config';
import type { MetaMessagingWebhookBody } from './meta.types';
import type { MetaWebhookRequest } from './meta-webhook.types';

const FACEBOOK_APP_SECRET = 'facebook-secret-test';
const INSTAGRAM_APP_SECRET = 'instagram-secret-test';

const EMPTY_WEBHOOK_BODY: MetaMessagingWebhookBody = {
  object: 'page',
  entry: [],
};

function signBody(body: Buffer, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

interface ConfigOverrides {
  appSecret?: string;
  instagramAppSecret?: string;
}

function createConfig(overrides: ConfigOverrides = {}): MetaProviderConfig {
  return {
    appSecret: overrides.appSecret ?? FACEBOOK_APP_SECRET,
    instagramAppSecret: overrides.instagramAppSecret ?? INSTAGRAM_APP_SECRET,
    webhookVerifyToken: 'verify-token',
    isWebhookVerifyConfigured: () => true,
  } as MetaProviderConfig;
}

function createService(overrides: ConfigOverrides = {}): MetaWebhookService {
  const leadIngestService = {
    ingestMessage: vi.fn().mockResolvedValue(undefined),
  };
  return new MetaWebhookService(createConfig(overrides), leadIngestService as never);
}

function createRequest(rawBody?: Buffer): MetaWebhookRequest {
  return { rawBody } as MetaWebhookRequest;
}

describe('MetaWebhookService.handleWebhook', () => {
  it('accepts a valid Facebook signature when both secrets are configured', async () => {
    const service = createService();
    const rawBody = Buffer.from('{"object":"page","entry":[]}');
    const signature = signBody(rawBody, FACEBOOK_APP_SECRET);

    await expect(
      service.handleWebhook(createRequest(rawBody), signature, EMPTY_WEBHOOK_BODY),
    ).resolves.toBeUndefined();
  });

  it('accepts a valid Instagram signature when both secrets are configured', async () => {
    const service = createService();
    const rawBody = Buffer.from('{"object":"instagram","entry":[]}');
    const signature = signBody(rawBody, INSTAGRAM_APP_SECRET);

    await expect(
      service.handleWebhook(createRequest(rawBody), signature, {
        object: 'instagram',
        entry: [],
      }),
    ).resolves.toBeUndefined();
  });

  it('accepts when either matching secret validates with both configured', async () => {
    const service = createService();
    const rawBody = Buffer.from('{"object":"instagram","entry":[]}');
    const signature = signBody(rawBody, INSTAGRAM_APP_SECRET);

    await expect(
      service.handleWebhook(createRequest(rawBody), signature, {
        object: 'instagram',
        entry: [],
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects invalid signature with 401 Invalid webhook signature', async () => {
    const service = createService();
    const rawBody = Buffer.from('{"object":"page","entry":[]}');

    await expect(
      service.handleWebhook(createRequest(rawBody), 'sha256=deadbeef', EMPTY_WEBHOOK_BODY),
    ).rejects.toMatchObject({
      response: { message: 'Invalid webhook signature', statusCode: 401 },
    });
    await expect(
      service.handleWebhook(createRequest(rawBody), 'sha256=deadbeef', EMPTY_WEBHOOK_BODY),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects missing signature header with 401', async () => {
    const service = createService();
    const rawBody = Buffer.from('{"object":"page","entry":[]}');

    await expect(
      service.handleWebhook(createRequest(rawBody), undefined, EMPTY_WEBHOOK_BODY),
    ).rejects.toMatchObject({
      response: { message: 'Invalid webhook signature', statusCode: 401 },
    });
  });

  it('rejects missing rawBody when secrets are configured', async () => {
    const service = createService();
    const rawBody = Buffer.from('{"object":"page","entry":[]}');
    const signature = signBody(rawBody, FACEBOOK_APP_SECRET);

    await expect(
      service.handleWebhook(createRequest(undefined), signature, EMPTY_WEBHOOK_BODY),
    ).rejects.toMatchObject({
      response: { message: 'Invalid webhook signature', statusCode: 401 },
    });
  });

  it('does not fall back to JSON.stringify for signature verification', async () => {
    const service = createService({ appSecret: FACEBOOK_APP_SECRET, instagramAppSecret: '' });
    const rawBody = Buffer.from('{\n  "object": "instagram",\n  "entry": [ ]\n}\n');
    const signature = signBody(rawBody, FACEBOOK_APP_SECRET);
    const parsedBody = JSON.parse(rawBody.toString('utf8')) as MetaMessagingWebhookBody;

    await expect(
      service.handleWebhook(createRequest(undefined), signature, parsedBody),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('handles duplicate secret values without duplicate side effects', async () => {
    const sharedSecret = 'shared-secret-test';
    const service = createService({
      appSecret: sharedSecret,
      instagramAppSecret: sharedSecret,
    });
    const rawBody = Buffer.from('{"object":"page","entry":[]}');
    const signature = signBody(rawBody, sharedSecret);

    await expect(
      service.handleWebhook(createRequest(rawBody), signature, EMPTY_WEBHOOK_BODY),
    ).resolves.toBeUndefined();
  });

  it('accepts Facebook signature when only Facebook secret is configured', async () => {
    const service = createService({ instagramAppSecret: '' });
    const rawBody = Buffer.from('{"object":"page","entry":[]}');
    const facebookSignature = signBody(rawBody, FACEBOOK_APP_SECRET);
    const instagramSignature = signBody(rawBody, INSTAGRAM_APP_SECRET);

    await expect(
      service.handleWebhook(createRequest(rawBody), facebookSignature, EMPTY_WEBHOOK_BODY),
    ).resolves.toBeUndefined();
    await expect(
      service.handleWebhook(createRequest(rawBody), instagramSignature, EMPTY_WEBHOOK_BODY),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts Instagram signature when only Instagram secret is configured', async () => {
    const service = createService({ appSecret: '' });
    const rawBody = Buffer.from('{"object":"instagram","entry":[]}');
    const facebookSignature = signBody(rawBody, FACEBOOK_APP_SECRET);
    const instagramSignature = signBody(rawBody, INSTAGRAM_APP_SECRET);

    await expect(
      service.handleWebhook(createRequest(rawBody), instagramSignature, {
        object: 'instagram',
        entry: [],
      }),
    ).resolves.toBeUndefined();
    await expect(
      service.handleWebhook(createRequest(rawBody), facebookSignature, {
        object: 'instagram',
        entry: [],
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('skips signature verification when no webhook secrets are configured', async () => {
    const service = createService({ appSecret: '', instagramAppSecret: '' });

    await expect(
      service.handleWebhook(createRequest(undefined), undefined, EMPTY_WEBHOOK_BODY),
    ).resolves.toBeUndefined();
  });
});
