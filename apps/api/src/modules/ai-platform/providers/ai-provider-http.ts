import type { AiProviderType } from '@nbos/shared';
import {
  AI_PROVIDER_HTTP_TIMEOUT_MS,
  HTTP_REDIRECT_STATUS_MAX,
  HTTP_REDIRECT_STATUS_MIN,
} from './ai-provider.constants';
import { assertSafeProviderRequestUrl } from './ai-provider-url';
import type { AiProviderFetch } from './ai-provider.types';

export class AiProviderHttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly errorCode: string,
  ) {
    super(errorCode);
    this.name = 'AiProviderHttpError';
  }
}

export function mapProviderHttpStatus(statusCode: number): string {
  if (statusCode === 401 || statusCode === 403) {
    return 'PROVIDER_AUTH_FAILED';
  }
  if (statusCode === 429) {
    return 'PROVIDER_RATE_LIMITED';
  }
  if (statusCode >= 500) {
    return 'PROVIDER_ERROR';
  }
  return 'PROVIDER_REQUEST_FAILED';
}

export async function providerHttpRequest(
  fetchImpl: AiProviderFetch,
  url: string,
  init: RequestInit,
  provider: AiProviderType,
): Promise<Response> {
  assertSafeProviderRequestUrl(url, provider);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_PROVIDER_HTTP_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      ...init,
      redirect: 'manual',
      signal: controller.signal,
    });
    if (isRedirectStatus(response.status)) {
      throw new AiProviderHttpError(response.status, 'PROVIDER_REDIRECT_BLOCKED');
    }
    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AiProviderHttpError(0, 'TIMEOUT');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function providerHttpJson<T>(
  fetchImpl: AiProviderFetch,
  url: string,
  init: RequestInit,
  provider: AiProviderType,
): Promise<T> {
  const response = await providerHttpRequest(fetchImpl, url, init, provider);
  if (!response.ok) {
    throw new AiProviderHttpError(response.status, mapProviderHttpStatus(response.status));
  }
  return (await response.json()) as T;
}

function isRedirectStatus(statusCode: number): boolean {
  return statusCode >= HTTP_REDIRECT_STATUS_MIN && statusCode <= HTTP_REDIRECT_STATUS_MAX;
}

export function trimBaseUrl(baseUrl: string | null | undefined, fallback: string): string {
  const raw = baseUrl?.trim();
  if (!raw) {
    return fallback;
  }
  return raw.replace(/\/+$/, '');
}
