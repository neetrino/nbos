import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { MetaController } from './meta.controller';
import { MetaInstagramOAuthException } from './meta-instagram-oauth.errors';
import type { MetaAccountsService } from './meta-accounts.service';
import type { MetaOAuthService } from './meta-oauth.service';
import type { MetaWebhookService } from './meta-webhook.service';

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
  it('redirects with instagram_token_exchange_failed for token exchange stage errors', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}`,
    );
    const controller = createController({
      handleCallback: vi
        .fn()
        .mockRejectedValue(
          new MetaInstagramOAuthException(
            'Instagram token exchange did not return user_id',
            'token_exchange',
          ),
        ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith('instagram_token_exchange_failed');
    expect(res.redirectUrl).toContain('reason=instagram_token_exchange_failed');
  });

  it('redirects with instagram_long_lived_token_failed for long-lived token stage errors', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}`,
    );
    const controller = createController({
      handleCallback: vi
        .fn()
        .mockRejectedValue(
          new MetaInstagramOAuthException('Instagram Graph API request failed', 'long_lived_token'),
        ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith('instagram_long_lived_token_failed');
  });

  it('redirects with instagram_profile_failed for profile stage errors', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}`,
    );
    const controller = createController({
      handleCallback: vi
        .fn()
        .mockRejectedValue(
          new MetaInstagramOAuthException(
            'Instagram profile response missing account id',
            'profile',
          ),
        ),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith('instagram_profile_failed');
  });

  it('keeps Facebook token_exchange_failed mapping for generic token errors', async () => {
    const buildErrorRedirectUrl = vi.fn(
      (reason: string) =>
        `http://localhost:3000/settings/integrations?oauth=error&reason=${reason}`,
    );
    const controller = createController({
      handleCallback: vi
        .fn()
        .mockRejectedValue(new BadRequestException('Meta Graph API token request failed')),
      buildErrorRedirectUrl,
    });
    const res = createMockResponse();

    await controller.oauthCallback('auth-code', undefined, undefined, 'signed-state', res);

    expect(buildErrorRedirectUrl).toHaveBeenCalledWith('token_exchange_failed');
  });
});
