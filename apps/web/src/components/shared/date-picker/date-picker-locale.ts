import { NBOS_DATE_PICKER_DEFAULT_LOCALE } from './date-picker-constants';

/** Maps next-intl interface locale to BCP-47 for Intl/date-fns display. */
export function resolveDatePickerLocale(
  interfaceLocale: string,
  explicitLocale?: string,
): string {
  if (explicitLocale) return explicitLocale;
  if (interfaceLocale === 'ru') return 'ru-RU';
  if (interfaceLocale === 'en') return 'en-US';
  return NBOS_DATE_PICKER_DEFAULT_LOCALE;
}
