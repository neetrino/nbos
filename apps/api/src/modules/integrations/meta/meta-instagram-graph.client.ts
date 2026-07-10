import { BadRequestException } from '@nestjs/common';
import type { MetaGraphTokenResponse } from './meta.types';
import {
  MetaOAuthCallbackError,
  formatInstagramPayloadDiagnostic,
} from './meta-oauth-callback.error';
import { fetchJsonWithTimeout, META_PROFILE_FETCH_TIMEOUT_MS } from './meta-fetch.util';
import type { MetaProfileLookupResult } from './meta-messaging-profile.types';

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
  profile_pic?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function throwResponseParsingError(
  message: string,
  context: InstagramResponseContext,
  payload: unknown,
): never {
  throw new MetaOAuthCallbackError({
    message,
    publicReason: 'instagram_response_invalid',
    stage: 'instagram_response_parsing',
    platform: 'INSTAGRAM',
    safeDetails: formatInstagramPayloadDiagnostic(payload),
  });
}

function unwrapInstagramPayload<T extends Record<string, unknown>>(
  payload: unknown,
  context: InstagramResponseContext,
): T {
  if (!isRecord(payload)) {
    throwResponseParsingError(
      `Instagram ${context} response was not a JSON object`,
      context,
      payload,
    );
  }

  if (Array.isArray(payload.data)) {
    if (payload.data.length === 0) {
      throwResponseParsingError(
        `Instagram ${context} response data envelope was empty`,
        context,
        payload,
      );
    }
    const first = payload.data[0];
    if (!isRecord(first)) {
      throwResponseParsingError(
        `Instagram ${context} response data item was invalid`,
        context,
        payload,
      );
    }
    return first as T;
  }

  return payload as T;
}

function readInstagramTokenExchangeError(
  payload: unknown,
  upstreamStatus: number,
): MetaOAuthCallbackError {
  const errorMessage =
    isRecord(payload) && typeof payload.error_message === 'string' && payload.error_message.trim()
      ? payload.error_message
      : 'Instagram token exchange failed';
  const upstreamCode =
    isRecord(payload) && payload.code !== undefined && payload.code !== null
      ? (payload.code as string | number)
      : undefined;
  const upstreamType =
    isRecord(payload) && typeof payload.error_type === 'string' ? payload.error_type : undefined;

  return new MetaOAuthCallbackError({
    message: errorMessage,
    publicReason: 'instagram_token_exchange_failed',
    stage: 'instagram_token_exchange',
    platform: 'INSTAGRAM',
    upstreamStatus,
    upstreamCode,
    upstreamType,
    safeDetails: formatInstagramPayloadDiagnostic(payload),
  });
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
      throw readInstagramTokenExchangeError(raw, response.status);
    }

    const normalized = unwrapInstagramPayload<Record<string, unknown>>(raw, 'token_exchange');
    const accessToken = normalized.access_token;
    const userId = normalized.user_id;

    if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      throwResponseParsingError(
        'Instagram token exchange did not return access_token',
        'token_exchange',
        raw,
      );
    }
    if (!hasUserId(userId as string | number | undefined | null)) {
      throwResponseParsingError(
        'Instagram token exchange did not return user_id',
        'token_exchange',
        raw,
      );
    }

    return { access_token: accessToken, user_id: userId as string | number };
  }

  async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaGraphTokenResponse> {
    const url = new URL(INSTAGRAM_LONG_LIVED_TOKEN_URL);
    url.searchParams.set('grant_type', 'ig_exchange_token');
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('access_token', shortLivedToken);
    const raw = await this.fetchJson<MetaGraphTokenResponse>(
      url.toString(),
      { method: 'GET' },
      'instagram_long_lived_token',
    );
    if (typeof raw.access_token !== 'string' || raw.access_token.trim().length === 0) {
      throw new MetaOAuthCallbackError({
        message: 'Instagram long-lived token exchange did not return access_token',
        publicReason: 'instagram_response_invalid',
        stage: 'instagram_response_parsing',
        platform: 'INSTAGRAM',
        safeDetails: formatInstagramPayloadDiagnostic(raw),
      });
    }
    return raw;
  }

  async fetchProfile(accessToken: string): Promise<MetaInstagramProfile> {
    const url = new URL(`${this.graphBaseUrl}/me`);
    url.searchParams.set('fields', 'user_id,username,name');
    url.searchParams.set('access_token', accessToken);
    const raw = await this.fetchJson<unknown>(url.toString(), undefined, 'instagram_profile');
    const profile = unwrapInstagramPayload<Partial<MetaInstagramProfile>>(raw, 'profile');
    const accountId = profile.user_id ?? profile.id;
    if (!accountId) {
      throw new MetaOAuthCallbackError({
        message: 'Instagram profile response missing account id',
        publicReason: 'instagram_profile_failed',
        stage: 'instagram_profile',
        platform: 'INSTAGRAM',
        safeDetails: formatInstagramPayloadDiagnostic(raw),
      });
    }
    return { ...profile, id: String(accountId) };
  }

  async fetchMessagingUserProfile(
    senderScopedId: string,
    accessToken: string,
  ): Promise<MetaProfileLookupResult> {
    const url = new URL(`${this.graphBaseUrl}/${senderScopedId}`);
    url.searchParams.set('fields', 'name,username,profile_pic');
    url.searchParams.set('access_token', accessToken);
    const raw = await fetchJsonWithTimeout(
      url.toString(),
      undefined,
      META_PROFILE_FETCH_TIMEOUT_MS,
    );
    return mapInstagramMessagingProfileResult(raw);
  }

  private async fetchJson<T>(
    url: string,
    init?: RequestInit,
    stage?: 'instagram_long_lived_token' | 'instagram_profile',
  ): Promise<T> {
    const response = await fetch(url, init);
    const body = (await response.json()) as T & {
      error?: { message?: string; type?: string; code?: number };
    };
    if (!response.ok || body.error) {
      const message = body.error?.message ?? 'Instagram Graph API request failed';
      if (stage === 'instagram_long_lived_token') {
        throw new MetaOAuthCallbackError({
          message,
          publicReason: 'instagram_long_lived_token_failed',
          stage: 'instagram_long_lived_token',
          platform: 'INSTAGRAM',
          upstreamStatus: response.ok ? undefined : response.status,
          upstreamCode: body.error?.code,
          upstreamType: body.error?.type,
          safeDetails: isRecord(body) ? formatInstagramPayloadDiagnostic(body) : undefined,
        });
      }
      if (stage === 'instagram_profile') {
        throw new MetaOAuthCallbackError({
          message,
          publicReason: 'instagram_profile_failed',
          stage: 'instagram_profile',
          platform: 'INSTAGRAM',
          upstreamStatus: response.ok ? undefined : response.status,
          upstreamCode: body.error?.code,
          upstreamType: body.error?.type,
          safeDetails: isRecord(body) ? formatInstagramPayloadDiagnostic(body) : undefined,
        });
      }
      throw new BadRequestException(message);
    }
    return body;
  }
}

function mapInstagramMessagingProfileResult(result: {
  ok: boolean;
  status: number;
  body: unknown;
}): MetaProfileLookupResult {
  if (!result.ok) {
    const body = result.body as { error?: { message?: string; code?: number } };
    return {
      ok: false,
      errorCode: body.error?.code
        ? String(body.error.code)
        : String(result.status || 'fetch_failed'),
      errorMessage: body.error?.message ?? 'Instagram profile lookup failed',
    };
  }

  try {
    const profile = unwrapInstagramPayload<Partial<MetaInstagramProfile>>(result.body, 'profile');
    return {
      ok: true,
      profile: {
        displayName: profile.name?.trim() || null,
        username: profile.username?.trim() || null,
        firstName: null,
        lastName: null,
        profilePictureUrl: profile.profile_pic?.trim() || null,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Instagram profile response invalid';
    return { ok: false, errorCode: 'invalid_response', errorMessage: message };
  }
}
