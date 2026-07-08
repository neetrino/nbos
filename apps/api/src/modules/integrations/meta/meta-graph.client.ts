import { BadRequestException } from '@nestjs/common';
import type { MetaGraphPage, MetaGraphTokenResponse } from './meta.types';

const PAGE_FIELDS = 'id,name,access_token,instagram_business_account{id,username,name}';

export class MetaGraphClient {
  constructor(
    private readonly graphBaseUrl: string,
    private readonly appId: string,
    private readonly appSecret: string,
  ) {}

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaGraphTokenResponse> {
    const url = new URL(`${this.graphBaseUrl}/oauth/access_token`);
    url.searchParams.set('client_id', this.appId);
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('code', code);
    return this.fetchJson<MetaGraphTokenResponse>(url.toString());
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaGraphTokenResponse> {
    const url = new URL(`${this.graphBaseUrl}/oauth/access_token`);
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', this.appId);
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('fb_exchange_token', shortLivedToken);
    return this.fetchJson<MetaGraphTokenResponse>(url.toString());
  }

  async fetchUserPages(userAccessToken: string): Promise<MetaGraphPage[]> {
    const url = new URL(`${this.graphBaseUrl}/me/accounts`);
    url.searchParams.set('fields', PAGE_FIELDS);
    url.searchParams.set('access_token', userAccessToken);
    const data = await this.fetchJson<{ data?: MetaGraphPage[] }>(url.toString());
    return data.data ?? [];
  }

  async subscribePageToWebhook(pageId: string, pageAccessToken: string): Promise<void> {
    const url = new URL(`${this.graphBaseUrl}/${pageId}/subscribed_apps`);
    url.searchParams.set('subscribed_fields', 'messages,messaging_postbacks');
    url.searchParams.set('access_token', pageAccessToken);
    await this.fetchJson(url.toString(), { method: 'POST' });
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json()) as T & { error?: { message?: string } };
    if (!response.ok || body.error) {
      throw new BadRequestException(body.error?.message ?? 'Meta Graph API request failed');
    }
    return body;
  }
}
