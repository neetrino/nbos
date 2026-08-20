import { AuthSessionClientKind } from '@nbos/database';
import {
  AUTH_SESSION_CLIENT_KINDS,
  isAuthSessionClientKind,
  isNativeAuthSessionClientKind,
  type AuthSessionClientKindApi,
} from '@nbos/shared';
import { parseCorsOriginsFromEnv } from '../../security/cors-origins';
import { resolveRequestOrigin } from '../../security/request-origin';

export const AUTH_SESSION_DEVICE_LABEL_MAX = 120;

const PRISMA_BY_API: Record<AuthSessionClientKindApi, AuthSessionClientKind> = {
  web: 'WEB',
  mobile_work: 'MOBILE_WORK',
  mobile_messenger: 'MOBILE_MESSENGER',
  mobile_vault: 'MOBILE_VAULT',
};

const API_BY_PRISMA: Record<string, AuthSessionClientKindApi> = {
  WEB: 'web',
  MOBILE_WORK: 'mobile_work',
  MOBILE_MESSENGER: 'mobile_messenger',
  MOBILE_VAULT: 'mobile_vault',
};

export function parseAuthSessionClientKind(
  raw: string | undefined,
): AuthSessionClientKindApi | undefined {
  if (!raw?.trim()) return undefined;
  const normalized = raw.trim().toLowerCase();
  return isAuthSessionClientKind(normalized) ? normalized : undefined;
}

export function toPrismaAuthSessionClientKind(
  kind: AuthSessionClientKindApi,
): AuthSessionClientKind {
  return PRISMA_BY_API[kind];
}

export function fromPrismaAuthSessionClientKind(raw: string | undefined): AuthSessionClientKindApi {
  if (!raw) return 'web';
  return API_BY_PRISMA[raw] ?? 'web';
}

export function resolveIssuedClientKind(input: {
  requested?: string;
  origin?: string;
  referer?: string;
  bffHeader?: string;
}): AuthSessionClientKindApi {
  if (isBrowserOrBffRequest(input)) return 'web';
  return parseAuthSessionClientKind(input.requested) ?? 'web';
}

export function shouldExposeRefreshInJson(input: {
  clientKind: AuthSessionClientKindApi;
  origin?: string;
  referer?: string;
  bffHeader?: string;
}): boolean {
  if (isBrowserOrBffRequest(input)) return false;
  return isNativeAuthSessionClientKind(input.clientKind);
}

export function sanitizeDeviceLabel(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, AUTH_SESSION_DEVICE_LABEL_MAX);
}

export function deviceLabelFromUserAgent(userAgent: string | undefined): string | undefined {
  if (!userAgent?.trim()) return undefined;
  const ua = userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua) && !/Chromium/.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua) && !/Chrome\//.test(ua)
          ? 'Safari'
          : undefined;
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Mac OS X/.test(ua)
        ? 'macOS'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : undefined;
  if (!browser && !os) return sanitizeDeviceLabel(ua);
  return sanitizeDeviceLabel([browser, os].filter(Boolean).join(' · '));
}

export function resolveSessionDeviceLabel(input: {
  deviceLabel?: string;
  userAgent?: string;
}): string | undefined {
  return sanitizeDeviceLabel(input.deviceLabel) ?? deviceLabelFromUserAgent(input.userAgent);
}

function isBrowserOrBffRequest(input: {
  origin?: string;
  referer?: string;
  bffHeader?: string;
}): boolean {
  const bff = input.bffHeader === '1' || input.bffHeader === 'true';
  if (bff) return true;
  const resolved = resolveRequestOrigin(input.origin, input.referer);
  if (!resolved) return false;
  return new Set(parseCorsOriginsFromEnv()).has(resolved);
}

export const AUTH_SESSION_CLIENT_KIND_VALUES = AUTH_SESSION_CLIENT_KINDS;
