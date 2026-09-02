import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { MetaController } from './meta.controller';
import { MetaOAuthCallbackError } from './meta-oauth-callback.error';
import type { MetaAccountsService } from './meta-accounts.service';
import type { MetaOAuthService } from './meta-oauth.service';
import type { MetaWebhookService } from './meta-webhook.service';
import type { MetaWebhookRequest } from './meta-webhook.types';

function createController(oauthService: Partial<MetaOAuthService>): MetaController {
  return new MetaController(
    oauthService as MetaOAuthService,
    {} as MetaAccountsService,
    {} as MetaWebhookService,
  );
}

function createMockResponse(): Response & { redirectUrl?: string } {
  const res = {
    redirect: vi.fn((url: string) => {
      res.redirectUrl = url;
    }),
  };
  return res as Response & { redirectUrl?: string };
}

describe('MetaController.oauthCallback error mapping', () => {
  it('redirects with instagram_token_exchange_failed and error_id', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi.fn().mockRejectedValue(
        new MetaOAuthCallbackError({
          message: 'Instagram token exchange did not return user_id',
          publicReason: 'instagram_token_exchange_failed',
          stage: 'instagram_token_exchange',
          platform: 'INSTAGRAM',
        }),
      ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith(
      'instagram_token_exchange_failed',
      expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    );
    expect(res.redirectUrl).toContain('reason=instagram_token_exchange_failed');
    expect(res.redirectUrl).toContain('error_id=');
    expect(res.redirectUrl).not.toContain('auth-code');
    expect(res.redirectUrl).not.toContain('signed-state');
  });

  it('redirects with instagram_long_lived_token_failed', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi.fn().mockRejectedValue(
        new MetaOAuthCallbackError({
          message: 'Instagram Graph API request failed',
          publicReason: 'instagram_long_lived_token_failed',
          stage: 'instagram_long_lived_token',
          platform: 'INSTAGRAM',
        }),
      ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith(
      'instagram_long_lived_token_failed',
      expect.any(String),
    );
  });

  it('redirects with instagram_profile_failed', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi.fn().mockRejectedValue(
        new MetaOAuthCallbackError({
          message: 'Instagram profile response missing account id',
          publicReason: 'instagram_profile_failed',
          stage: 'instagram_profile',
          platform: 'INSTAGRAM',
        }),
      ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith(
      'instagram_profile_failed',
      expect.any(String),
    );
  });

  it('redirects with instagram_response_invalid for parsing failures', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi.fn().mockRejectedValue(
        new MetaOAuthCallbackError({
          message: 'Instagram token exchange response data envelope was empty',
          publicReason: 'instagram_response_invalid',
          stage: 'instagram_response_parsing',
          platform: 'INSTAGRAM',
          safeDetails: '{"topLevelKeys":["data"],"hasData":true,"dataIsArray":true,"dataLength":0}',
        }),
      ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith(
      'instagram_response_invalid',
      expect.any(String),
    );
  });

  it('redirects with instagram_account_save_failed for persistence failures', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi
        .fn()
        .mockRejectedValue(MetaOAuthCallbackError.fromPrismaPersistence({ code: 'P2002' })),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith(
      'instagram_account_save_failed',
      expect.any(String),
    );
  });

  it('keeps Facebook token_exchange_failed mapping for generic token errors', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi
        .fn()
        .mockRejectedValue(new BadRequestException('Meta Graph API token request failed')),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith('token_exchange_failed', expect.any(String));
  });

  it('redirects unknown legacy errors with error_id only', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string, errorId?: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}&error_id=${errorId}`,
    );
    const controller = createController({
      handleCallback: vi.fn().mockRejectedValue(new Error('unexpected runtime failure')),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith('unknown', expect.any(String));
    expect(res.redirectUrl).toContain('error_id=');
    expect(res.redirectUrl).not.toContain('unexpected');
  });
});

describe('MetaController.verifyWebhook diagnostic', () => {
  function createWebhookResponse(): Response & {
    statusCode?: number;
    body?: unknown;
    headers: Record<string, string>;
  } {
    const res = {
      headers: {} as Record<string, string>,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      set(name: string, value: string) {
        res.headers[name] = value;
        return res;
      },
      send(body: unknown) {
        res.body = body;
        return res;
      },
    };
    return res as Response & {
      statusCode?: number;
      body?: unknown;
      headers: Record<string, string>;
    };
  }

  function createWebhookController(webhookService: Partial<MetaWebhookService>): MetaController {
    return new MetaController(
      {} as MetaOAuthService,
      {} as MetaAccountsService,
      webhookService as MetaWebhookService,
    );
  }

  it('echoes hub.challenge as plain text without calling token validation', () => {
    const verifySubscription = vi.fn();
    const controller = createWebhookController({ verifySubscription });
    const res = createWebhookResponse();

    controller.verifyWebhook(
      {
        headers: {
          'user-agent': 'facebookplatform/1.0',
          'cf-connecting-ip': '1.2.3.4',
          'cf-ipcountry': 'US',
          'x-forwarded-for': '1.2.3.4',
        },
      } as MetaWebhookRequest,
      'subscribe',
      'wrong-token',
      'challenge-123',
      res,
    );

    expect(verifySubscription).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe('text/plain');
    expect(res.body).toBe('challenge-123');
  });

  it('returns HTTP 400 plain text when hub.challenge is missing', () => {
    const controller = createWebhookController({});
    const res = createWebhookResponse();

    controller.verifyWebhook(
      { headers: {} } as MetaWebhookRequest,
      'subscribe',
      'any-token',
      undefined,
      res,
    );

    expect(res.statusCode).toBe(400);
    expect(res.headers['Content-Type']).toBe('text/plain');
    expect(res.body).toBe('Missing hub.challenge');
  });
});
