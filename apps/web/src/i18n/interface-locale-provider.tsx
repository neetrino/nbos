'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { WritableInterfaceLocale } from '@nbos/shared';
import { patchMyInterfaceLocale } from '@/lib/api/me-preferences';
import { INTERFACE_TIME_ZONE } from './constants';
import { writeLocaleCookie } from './cookie';
import { PermissionDeniedCopySync } from './permission-denied-copy-sync';
import { useAuthenticatedLocaleRestore } from './use-authenticated-locale-restore';

type InterfaceLocaleController = {
  locale: WritableInterfaceLocale;
  saving: boolean;
  changeLocale: (next: WritableInterfaceLocale) => Promise<void>;
};

const InterfaceLocaleContext = createContext<InterfaceLocaleController | null>(null);

export function useInterfaceLocale(): InterfaceLocaleController {
  const value = useContext(InterfaceLocaleContext);
  if (!value) {
    throw new Error('useInterfaceLocale must be used within InterfaceLocaleProvider');
  }
  return value;
}

export function InterfaceLocaleProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode;
  initialLocale: WritableInterfaceLocale;
  initialMessages: AbstractIntlMessages;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);
  const [saving, setSaving] = useState(false);
  const requestIdRef = useRef(0);

  if (locale !== initialLocale) {
    setLocale(initialLocale);
    setMessages(initialMessages);
  }

  useAuthenticatedLocaleRestore(locale, saving);

  const changeLocale = useCallback(
    async (next: WritableInterfaceLocale) => {
      const requestId = ++requestIdRef.current;
      setSaving(true);
      try {
        const saved = await patchMyInterfaceLocale(next);
        if (requestId !== requestIdRef.current) return;
        writeLocaleCookie(saved.interfaceLocale, session?.user?.id);
        router.refresh();
      } finally {
        if (requestId === requestIdRef.current) {
          setSaving(false);
        }
      }
    },
    [router, session?.user?.id],
  );

  const value = useMemo(
    () => ({ locale, saving, changeLocale }),
    [locale, saving, changeLocale],
  );

  return (
    <InterfaceLocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={INTERFACE_TIME_ZONE}>
        <PermissionDeniedCopySync />
        {children}
      </NextIntlClientProvider>
    </InterfaceLocaleContext.Provider>
  );
}
