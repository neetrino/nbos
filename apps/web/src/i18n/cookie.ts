import { isWritableInterfaceLocale, type WritableInterfaceLocale } from '@nbos/shared';
import {
  INTERFACE_LOCALE_COOKIE,
  INTERFACE_LOCALE_COOKIE_MAX_AGE_SECONDS,
  INTERFACE_LOCALE_OWNER_COOKIE,
} from './constants';

export function parseLocaleCookieValue(value: string | undefined | null): WritableInterfaceLocale | undefined {
  return isWritableInterfaceLocale(value) ? value : undefined;
}

export function parseLocaleOwnerCookieValue(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const owner = value.trim();
  return owner.length > 0 ? owner : undefined;
}

export function writeLocaleCookie(locale: WritableInterfaceLocale, ownerUserId?: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = serializeBrowserCookie(INTERFACE_LOCALE_COOKIE, locale);
  if (ownerUserId?.trim()) {
    document.cookie = serializeBrowserCookie(INTERFACE_LOCALE_OWNER_COOKIE, ownerUserId.trim());
  }
}

export function clearLocaleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = expireBrowserCookie(INTERFACE_LOCALE_COOKIE);
  document.cookie = expireBrowserCookie(INTERFACE_LOCALE_OWNER_COOKIE);
}

function serializeBrowserCookie(name: string, value: string): string {
  return [
    `${name}=${value}`,
    'Path=/',
    `Max-Age=${INTERFACE_LOCALE_COOKIE_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
  ].join('; ');
}

function expireBrowserCookie(name: string): string {
  return `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}
