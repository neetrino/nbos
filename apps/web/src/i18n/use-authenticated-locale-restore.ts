'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { WritableInterfaceLocale } from '@nbos/shared';
import { getMyInterfaceLocale } from '@/lib/api/me-preferences';
import { writeLocaleCookie } from './cookie';

/**
 * After BFF can refresh the access JWT, re-read the saved locale.
 * Does not treat the unbound locale cookie as source of truth.
 */
export function useAuthenticatedLocaleRestore(
  locale: WritableInterfaceLocale,
  saving: boolean,
): void {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    if (status !== 'authenticated' || !userId || saving) {
      return;
    }

    let cancelled = false;
    void getMyInterfaceLocale()
      .then((preference) => {
        if (cancelled) return;
        writeLocaleCookie(preference.interfaceLocale);
        if (preference.interfaceLocale !== localeRef.current) {
          router.refresh();
        }
      })
      .catch(() => {
        // API/BFF unavailable: keep the SSR locale and do not write English.
      });

    return () => {
      cancelled = true;
    };
  }, [router, saving, status, userId]);
}
