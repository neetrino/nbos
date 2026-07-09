import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import * as jwt from 'jsonwebtoken';
import { PRISMA_TOKEN } from '../../../database.module';
import { MetaGraphClient } from './meta-graph.client';
import { MetaInstagramGraphClient } from './meta-instagram-graph.client';
import type { MetaOAuthPlatform } from './meta-oauth.platform';
import {
  META_FACEBOOK_OAUTH_SCOPES,
  META_INSTAGRAM_OAUTH_SCOPES,
  MetaProviderConfig,
  buildFacebookOAuthUrl,
  buildInstagramOAuthUrl,
} from './meta-provider.config';
import { MetaProviderSecretStore } from './meta-provider-secret.store';
import { MetaOAuthCallbackError } from './meta-oauth-callback.error';
import type { MetaGraphPage, MetaOAuthErrorReason } from './meta.types';

const STATE_TTL_SECONDS = 600;

interface MetaOAuthState {
  employeeId: string;
  platform: MetaOAuthPlatform;
}

@Injectable()
export class MetaOAuthService {
  private readonly logger = new Logger(MetaOAuthService.name);
  private readonly jwtSecret: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: MetaProviderConfig,
    private readonly secretStore: MetaProviderSecretStore,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
  }

  buildAuthUrl(employeeId: string, platform: MetaOAuthPlatform): string {
    this.requireConfigured(platform);
    const statePayload: MetaOAuthState = { employeeId, platform };
    const state = jwt.sign(statePayload, this.jwtSecret, {
      expiresIn: STATE_TTL_SECONDS,
    });
    const redirectUri = this.config.oauthRedirectUri;
    const authorizeBaseUrl = this.config.authorizeUrlForPlatform(platform);
    const scopes = this.config.scopesForPlatform(platform);

    const clientIdSource = platform === 'INSTAGRAM' ? 'INSTAGRAM_APP_ID' : 'META_APP_ID';
    this.logger.log(
      `Meta OAuth start platform=${platform} clientIdSource=${clientIdSource} oauthBaseUrl=${authorizeBaseUrl} scopes=${scopes.join(',')} redirectUri=${redirectUri} statePlatform=${platform}`,
    );

    if (platform === 'FACEBOOK') {
      return buildFacebookOAuthUrl({
        authorizeBaseUrl,
        clientId: this.config.appId,
        redirectUri,
        state,
        scopes,
      });
    }

    return buildInstagramOAuthUrl({
      authorizeBaseUrl,
      clientId: this.config.instagramAppId,
      redirectUri,
      state,
      scopes,
    });
  }

  buildSuccessRedirectUrl(): string {
    return this.buildIntegrationsRedirectUrl({ oauth: 'success' });
  }

  buildErrorRedirectUrl(reason: MetaOAuthErrorReason, errorId?: string): string {
    const params: Record<string, string> = { oauth: 'error', reason };
    if (errorId && errorId.trim().length > 0) {
      params.error_id = errorId;
    }
    return this.buildIntegrationsRedirectUrl(params);
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string; accountCount: number }> {
    const { employeeId, platform } = this.verifyState(state);
    this.requireConfigured(platform);

    if (platform === 'INSTAGRAM') {
      return this.handleInstagramCallback(code, employeeId);
    }

    return this.handleFacebookCallback(code, employeeId);
  }

  private async handleFacebookCallback(
    code: string,
    employeeId: string,
  ): Promise<{ redirectUrl: string; accountCount: number }> {
    const graph = this.createFacebookGraphClient();
    const shortToken = await graph.exchangeCodeForToken(code, this.config.oauthRedirectUri);
    const longToken = await graph.exchangeForLongLivedToken(shortToken.access_token);
    const userAccessToken = longToken.access_token;
    const tokenExpiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000)
      : null;

    const pages = await graph.fetchUserPages(userAccessToken);
    if (pages.length === 0) {
      throw new BadRequestException('No Facebook Pages found for this Meta account');
    }

    let accountCount = 0;
    for (const page of pages) {
      accountCount += await this.upsertPageAccounts(
        employeeId,
        page,
        userAccessToken,
        tokenExpiresAt,
        graph,
      );
    }

    return {
      redirectUrl: this.buildSuccessRedirectUrl(),
      accountCount,
    };
  }

  private async handleInstagramCallback(
    code: string,
    employeeId: string,
  ): Promise<{ redirectUrl: string; accountCount: number }> {
    const instagramClient = this.createInstagramGraphClient();
    const shortToken = await instagramClient.exchangeCodeForToken(
      code,
      this.config.oauthRedirectUri,
    );
    const longToken = await instagramClient.exchangeForLongLivedToken(shortToken.access_token);
    const accessToken = longToken.access_token;
    const tokenExpiresAt = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000)
      : null;

    const profile = await instagramClient.fetchProfile(accessToken);
    const accountId = profile.id;
    const displayName = profile.username ? `@${profile.username}` : (profile.name ?? accountId);
    const scopes = [...META_INSTAGRAM_OAUTH_SCOPES];

    try {
      await this.upsertAccount({
        employeeId,
        platform: 'INSTAGRAM',
        displayName,
        pageId: accountId,
        instagramBusinessAccountId: accountId,
        externalAccountId: accountId,
        tokenExpiresAt,
        scopes,
        pageAccessToken: accessToken,
        userAccessToken: accessToken,
      });
    } catch (error) {
      if (error instanceof MetaOAuthCallbackError) {
        throw error;
      }
      throw MetaOAuthCallbackError.fromPrismaPersistence(error);
    }

    return {
      redirectUrl: this.buildSuccessRedirectUrl(),
      accountCount: 1,
    };
  }

  private async upsertPageAccounts(
    employeeId: string,
    page: MetaGraphPage,
    userAccessToken: string,
    tokenExpiresAt: Date | null,
    graph: MetaGraphClient,
  ): Promise<number> {
    let count = 0;
    const scopes = [...META_FACEBOOK_OAUTH_SCOPES];
    const facebookAccountId = await this.upsertAccount({
      employeeId,
      platform: 'FACEBOOK',
      displayName: page.name,
      pageId: page.id,
      instagramBusinessAccountId: page.instagram_business_account?.id ?? null,
      externalAccountId: page.id,
      tokenExpiresAt,
      scopes,
      pageAccessToken: page.access_token,
      userAccessToken,
    });
    count += 1;

    try {
      await graph.subscribePageToWebhook(page.id, page.access_token);
    } catch {
      await this.prisma.metaConnectedAccount.update({
        where: { id: facebookAccountId },
        data: {
          status: 'ERROR',
          lastErrorAt: new Date(),
          lastErrorMessage: 'Failed to subscribe page to Meta webhook',
        },
      });
    }

    const ig = page.instagram_business_account;
    if (ig?.id) {
      await this.upsertAccount({
        employeeId,
        platform: 'INSTAGRAM',
        displayName: ig.username ? `@${ig.username}` : (ig.name ?? page.name),
        pageId: page.id,
        instagramBusinessAccountId: ig.id,
        externalAccountId: ig.id,
        tokenExpiresAt,
        scopes,
        pageAccessToken: page.access_token,
        userAccessToken,
      });
      count += 1;
    }

    return count;
  }

  private async upsertAccount(params: {
    employeeId: string;
    platform: 'INSTAGRAM' | 'FACEBOOK';
    displayName: string;
    pageId: string;
    instagramBusinessAccountId: string | null;
    externalAccountId: string;
    tokenExpiresAt: Date | null;
    scopes: string[];
    pageAccessToken: string;
    userAccessToken: string;
  }): Promise<string> {
    const existing = await this.prisma.metaConnectedAccount.findUnique({
      where: {
        provider_externalAccountId: {
          provider: 'META',
          externalAccountId: params.externalAccountId,
        },
      },
      select: { id: true },
    });

    const accountData = {
      displayName: params.displayName,
      pageId: params.pageId,
      instagramBusinessAccountId: params.instagramBusinessAccountId,
      connectedByUserId: params.employeeId,
      status: 'CONNECTED' as const,
      tokenExpiresAt: params.tokenExpiresAt,
      scopes: params.scopes,
      lastErrorAt: null,
      lastErrorMessage: null,
    };

    const accountId = existing
      ? (
          await this.prisma.metaConnectedAccount.update({
            where: { id: existing.id },
            data: accountData,
            select: { id: true },
          })
        ).id
      : (
          await this.prisma.metaConnectedAccount.create({
            data: {
              provider: 'META',
              platform: params.platform,
              externalAccountId: params.externalAccountId,
              ...accountData,
            },
            select: { id: true },
          })
        ).id;

    await this.secretStore.store(accountId, {
      pageAccessToken: params.pageAccessToken,
      userAccessToken: params.userAccessToken,
    });

    return accountId;
  }

  private verifyState(state: string): MetaOAuthState {
    try {
      const payload = jwt.verify(state, this.jwtSecret) as Partial<MetaOAuthState>;
      if (!payload.employeeId) {
        throw new BadRequestException('Invalid or expired OAuth state');
      }
      if (payload.platform !== 'FACEBOOK' && payload.platform !== 'INSTAGRAM') {
        throw new BadRequestException('Invalid or expired OAuth state');
      }
      const platform = payload.platform;
      return { employeeId: payload.employeeId, platform };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  private createFacebookGraphClient(): MetaGraphClient {
    return new MetaGraphClient(this.config.graphBaseUrl, this.config.appId, this.config.appSecret);
  }

  private createInstagramGraphClient(): MetaInstagramGraphClient {
    return new MetaInstagramGraphClient(
      this.config.instagramGraphBaseUrl,
      this.config.instagramAppId,
      this.config.instagramAppSecret,
    );
  }

  private requireConfigured(platform: MetaOAuthPlatform): void {
    if (platform === 'INSTAGRAM') {
      if (!this.config.isInstagramConfigured()) {
        throw new BadRequestException(
          'Instagram OAuth is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.',
        );
      }
      return;
    }

    if (!this.config.isMetaConfigured()) {
      throw new BadRequestException(
        'Facebook OAuth is not configured. Set META_APP_ID and META_APP_SECRET.',
      );
    }
  }

  private buildIntegrationsRedirectUrl(params: Record<string, string>): string {
    const url = new URL(this.config.integrationsReturnPath, this.config.appUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value.trim().length > 0) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }
}
