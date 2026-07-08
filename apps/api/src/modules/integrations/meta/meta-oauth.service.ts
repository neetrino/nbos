import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@nbos/database';
import * as jwt from 'jsonwebtoken';
import { PRISMA_TOKEN } from '../../../database.module';
import { MetaGraphClient } from './meta-graph.client';
import { META_OAUTH_SCOPES, MetaProviderConfig, buildMetaOAuthUrl } from './meta-provider.config';
import { MetaProviderSecretStore } from './meta-provider-secret.store';
import type { MetaGraphPage, MetaOAuthErrorReason } from './meta.types';

const STATE_TTL_SECONDS = 600;

interface MetaOAuthState {
  employeeId: string;
}

@Injectable()
export class MetaOAuthService {
  private readonly jwtSecret: string;

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly config: MetaProviderConfig,
    private readonly secretStore: MetaProviderSecretStore,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
  }

  buildAuthUrl(employeeId: string): string {
    this.requireConfigured();
    const state = jwt.sign({ employeeId } satisfies MetaOAuthState, this.jwtSecret, {
      expiresIn: STATE_TTL_SECONDS,
    });
    return buildMetaOAuthUrl({
      dialogBaseUrl: this.config.oauthDialogUrl,
      appId: this.config.appId,
      redirectUri: this.config.oauthRedirectUri,
      state,
      scopes: META_OAUTH_SCOPES,
    });
  }

  buildSuccessRedirectUrl(): string {
    return this.buildIntegrationsRedirectUrl({ oauth: 'success' });
  }

  buildErrorRedirectUrl(reason: MetaOAuthErrorReason): string {
    return this.buildIntegrationsRedirectUrl({ oauth: 'error', reason });
  }

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ redirectUrl: string; accountCount: number }> {
    this.requireConfigured();
    const employeeId = this.verifyState(state);
    const graph = this.createGraphClient();

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

  private async upsertPageAccounts(
    employeeId: string,
    page: MetaGraphPage,
    userAccessToken: string,
    tokenExpiresAt: Date | null,
    graph: MetaGraphClient,
  ): Promise<number> {
    let count = 0;
    const scopes = [...META_OAUTH_SCOPES];
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

  private verifyState(state: string): string {
    try {
      const payload = jwt.verify(state, this.jwtSecret) as MetaOAuthState;
      return payload.employeeId;
    } catch {
      throw new BadRequestException('Invalid or expired OAuth state');
    }
  }

  private createGraphClient(): MetaGraphClient {
    return new MetaGraphClient(this.config.graphBaseUrl, this.config.appId, this.config.appSecret);
  }

  private requireConfigured(): void {
    if (!this.config.isMetaConfigured()) {
      throw new BadRequestException('Meta is not configured. Set META_APP_ID and META_APP_SECRET.');
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
