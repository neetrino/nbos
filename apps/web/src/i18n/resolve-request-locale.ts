import { cache } from 'react';
import { cookies } from 'next/headers';
import { DEFAULT_INTERFACE_LOCALE, type WritableInterfaceLocale } from '@nbos/shared';
import { getCachedAuthSession } from './cached-auth-session';
import { INTERFACE_LOCALE_COOKIE } from './constants';
import { parseLocaleCookieValue } from './cookie';
import { fetchAuthenticatedLocale } from './fetch-authenticated-locale';

export const resolveRequestLocale = cache(async (): Promise<WritableInterfaceLocale> => {
  const session = await getCachedAuthSession();
  if (session?.user) {
    const stored = await fetchAuthenticatedLocale();
    return stored ?? DEFAULT_INTERFACE_LOCALE;
  }
  const cookieStore = await cookies();
  return (
    parseLocaleCookieValue(cookieStore.get(INTERFACE_LOCALE_COOKIE)?.value) ??
    DEFAULT_INTERFACE_LOCALE
  );
});
