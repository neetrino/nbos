import { ensureBackendAccessToken } from '@/lib/auth/ensure-backend-access-token';
import { DEFAULT_INTERFACE_LOCALE, isWritableInterfaceLocale } from '@nbos/shared';
import type { WritableInterfaceLocale } from '@nbos/shared';
import { AUTHENTICATED_LOCALE_FETCH_TIMEOUT_MS } from './constants';
import { createServerAuthRequest } from './create-server-auth-request';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

/**
 * Reads Employee.interfaceLocale through the existing BFF access/refresh path.
 * Expired access tokens are refreshed via ensureBackendAccessToken — not a new rotation.
 * API/DB/refresh failure returns null so the caller uses English without writing
 * or applying a possibly foreign cookie.
 */
export async function fetchAuthenticatedLocale(): Promise<WritableInterfaceLocale | null> {
  const request = await createServerAuthRequest();
  const tokenResult = await ensureBackendAccessToken(request);
  if (tokenResult.kind !== 'available') {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/me/preferences`, {
      headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(AUTHENTICATED_LOCALE_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    const locale = readLocaleFromBody(body);
    return isWritableInterfaceLocale(locale) ? locale : DEFAULT_INTERFACE_LOCALE;
  } catch {
    return null;
  }
}

function readLocaleFromBody(body: unknown): unknown {
  if (!isRecord(body)) return undefined;
  if (isRecord(body.data)) return body.data.interfaceLocale;
  return body.interfaceLocale;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
