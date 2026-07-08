import { BadRequestException } from '@nestjs/common';
import type { MetaGraphTokenResponse } from './meta.types';

const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_LONG_LIVED_TOKEN_URL = 'https://graph.instagram.com/access_token';

export interface MetaInstagramCodeExchangeResponse {
  access_token: string;
  user_id: string | number;
}

export interface MetaInstagramProfile {
  id: string;
  user_id?: string;
  username?: string;
  name?: string;
}

/** Instagram Login Graph API client (separate from Facebook Page / Messenger flow). */
export class MetaInstagramGraphClient {
  constructor(
    private readonly graphBaseUrl: string,
    private readonly appId: string,
    private readonly appSecret: string,
  ) {}

  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<MetaInstagramCodeExchangeResponse> {
    const body = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });
    const response = await fetch(INSTAGRAM_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const payload = (await response.json()) as MetaInstagramCodeExchangeResponse & {
      error_message?: string;
      error_type?: string;
    };
    if (!response.ok || !payload.access_token) {
      throw new BadRequestException(payload.error_message ?? 'Instagram token exchange failed');
    }
    if (payload.user_id === undefined || payload.user_id === null || payload.user_id === '') {
      throw new BadRequestException('Instagram token exchange did not return user_id');
    }
    return payload;
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaGraphTokenResponse> {
    const url = new URL(INSTAGRAM_LONG_LIVED_TOKEN_URL);
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('access_token', shortLivedToken);
    return this.fetchJson<MetaGraphTokenResponse>(url.toString());
  }

  async fetchProfile(accessToken: string): Promise<MetaInstagramProfile> {
    const url = new URL(`${this.graphBaseUrl}/me`);
    url.searchParams.set('fields', 'user_id,username,name');
    url.searchParams.set('access_token', accessToken);
    const profile = await this.fetchJson<MetaInstagramProfile>(url.toString());
    const accountId = profile.user_id ?? profile.id;
    if (!accountId) {
      throw new BadRequestException('Instagram profile response missing account id');
    }
    return { ...profile, id: String(accountId) };
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json()) as T & { error?: { message?: string } };
    if (!response.ok || body.error) {
      throw new BadRequestException(body.error?.message ?? 'Instagram Graph API request failed');
    }
    return body;
  }
}
