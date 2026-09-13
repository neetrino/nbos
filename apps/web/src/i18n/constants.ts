import {
  DEFAULT_INTERFACE_LOCALE,
  WRITABLE_INTERFACE_LOCALES,
  type WritableInterfaceLocale,
} from '@nbos/shared';

export const INTERFACE_LOCALE_COOKIE = 'nbos-interface-locale';
export const INTERFACE_LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const INTERFACE_TIME_ZONE = 'Asia/Yerevan';

/** Bound the SSR preference read so a down/slow API cannot stall every page. */
export const AUTHENTICATED_LOCALE_FETCH_TIMEOUT_MS = 2000;

export const ENABLED_INTERFACE_LOCALES = WRITABLE_INTERFACE_LOCALES;
export const FALLBACK_INTERFACE_LOCALE = DEFAULT_INTERFACE_LOCALE;

export type EnabledInterfaceLocale = WritableInterfaceLocale;

export const INTERFACE_LOCALE_NATIVE_NAMES: Record<EnabledInterfaceLocale, string> = {
  en: 'English',
  ru: 'Русский',
  hy: 'Հայերեն',
};
