import { cache } from 'react';
import { ensureBackendAccessToken } from '@/lib/auth/ensure-backend-access-token';
import { AUTHENTICATED_LOCALE_FETCH_TIMEOUT_MS } from '@/i18n/constants';
import { createServerAuthRequest } from '@/i18n/create-server-auth-request';
import { parsePlatformAppearance } from './parse-platform-appearance';
import type { PlatformAppearanceView } from './types';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

async function fetchPlatformAppearanceUncached(): Promise<PlatformAppearanceView | null> {
  const request = await createServerAuthRequest();
  const tokenResult = await ensureBackendAccessToken(request);
  if (tokenResult.kind !== 'available') return null;

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/platform/appearance`, {
      headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(AUTHENTICATED_LOCALE_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return parsePlatformAppearance(await response.json());
  } catch {
    return null;
  }
}

export const fetchPlatformAppearance = cache(fetchPlatformAppearanceUncached);
