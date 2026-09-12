import { isWritableInterfaceLocale, type WritableInterfaceLocale } from '@nbos/shared';
import { INTERFACE_LOCALE_COOKIE, INTERFACE_LOCALE_COOKIE_MAX_AGE_SECONDS } from './constants';

/** Removed owner-binding cookie; expire leftovers on write/logout. */
const LEGACY_INTERFACE_LOCALE_OWNER_COOKIE = 'nbos-interface-locale-owner';

export function parseLocaleCookieValue(
  value: string | undefined | null,
): WritableInterfaceLocale | undefined {
  return isWritableInterfaceLocale(value) ? value : undefined;
}

export function writeLocaleCookie(locale: WritableInterfaceLocale): void {
  if (typeof document === 'undefined') return;
  document.cookie = serializeBrowserCookie(INTERFACE_LOCALE_COOKIE, locale);
  document.cookie = expireBrowserCookie(LEGACY_INTERFACE_LOCALE_OWNER_COOKIE);
}

export function clearLocaleCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = expireBrowserCookie(INTERFACE_LOCALE_COOKIE);
  document.cookie = expireBrowserCookie(LEGACY_INTERFACE_LOCALE_OWNER_COOKIE);
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
