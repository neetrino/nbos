import { BadRequestException } from '@nestjs/common';
import type { MetaGraphTokenResponse } from './meta.types';
import {
  MetaInstagramOAuthException,
  type MetaInstagramOAuthStage,
} from './meta-instagram-oauth.errors';

const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_LONG_LIVED_TOKEN_URL = 'https://graph.instagram.com/access_token';

type InstagramResponseContext = 'token_exchange' | 'profile';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stageForContext(context: InstagramResponseContext): MetaInstagramOAuthStage {
  return context === 'token_exchange' ? 'token_exchange' : 'profile';
}

function unwrapInstagramPayload<T extends Record<string, unknown>>(
  payload: unknown,
  context: InstagramResponseContext,
): T {
  const stage = stageForContext(context);

  if (!isRecord(payload)) {
    throw new MetaInstagramOAuthException(
      `Instagram ${context} response was not a JSON object`,
      stage,
    );
  }

  if (Array.isArray(payload.data)) {
    if (payload.data.length === 0) {
      throw new MetaInstagramOAuthException(
        `Instagram ${context} response data envelope was empty`,
        stage,
      );
    }
    const first = payload.data[0];
    if (!isRecord(first)) {
      throw new MetaInstagramOAuthException(
        `Instagram ${context} response data item was invalid`,
        stage,
      );
    }
    return first as T;
  }

  return payload as T;
}

function readInstagramErrorMessage(payload: unknown, fallback: string): string {
  if (
    isRecord(payload) &&
    typeof payload.error_message === 'string' &&
    payload.error_message.trim()
  ) {
    return payload.error_message;
  }
  return fallback;
}

function hasUserId(value: string | number | undefined | null): value is string | number {
  return value !== undefined && value !== null && value !== '';
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
    const raw = (await response.json()) as unknown;
    if (!response.ok) {
      throw new MetaInstagramOAuthException(
        readInstagramErrorMessage(raw, 'Instagram token exchange failed'),
        'token_exchange',
      );
    }

    const normalized = unwrapInstagramPayload<Record<string, unknown>>(raw, 'token_exchange');
    const accessToken = normalized.access_token;
    const userId = normalized.user_id;

    if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      throw new MetaInstagramOAuthException(
        'Instagram token exchange did not return access_token',
        'token_exchange',
      );
    }
    if (!hasUserId(userId as string | number | undefined | null)) {
      throw new MetaInstagramOAuthException(
        'Instagram token exchange did not return user_id',
        'token_exchange',
      );
    }

    return { access_token: accessToken, user_id: userId as string | number };
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaGraphTokenResponse> {
    const url = new URL(INSTAGRAM_LONG_LIVED_TOKEN_URL);
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('access_token', shortLivedToken);
    return this.fetchJson<MetaGraphTokenResponse>(url.toString(), undefined, 'long_lived_token');
  }

  async fetchProfile(accessToken: string): Promise<MetaInstagramProfile> {
    const url = new URL(`${this.graphBaseUrl}/me`);
    url.searchParams.set('fields', 'user_id,username,name');
    url.searchParams.set('access_token', accessToken);
    const raw = await this.fetchJson<unknown>(url.toString(), undefined, 'profile');
    const profile = unwrapInstagramPayload<Partial<MetaInstagramProfile>>(raw, 'profile');
    const accountId = profile.user_id ?? profile.id;
    if (!accountId) {
      throw new MetaInstagramOAuthException(
        'Instagram profile response missing account id',
        'profile',
      );
    }
    return { ...profile, id: String(accountId) };
  }

  private async fetchJson<T>(
    url: string,
    init?: RequestInit,
    stage?: MetaInstagramOAuthStage,
  ): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json()) as T & { error?: { message?: string } };
    if (!response.ok || body.error) {
      const message = body.error?.message ?? 'Instagram Graph API request failed';
      if (stage) {
        throw new MetaInstagramOAuthException(message, stage);
      }
      throw new BadRequestException(message);
    }
    return body;
  }
}
