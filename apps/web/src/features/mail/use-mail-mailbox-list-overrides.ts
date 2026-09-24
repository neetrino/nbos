'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { getPersistedReplaceStore } from '@/lib/persisted-client-state/create-persisted-replace-store';
import {
  EMPTY_MAIL_MAILBOX_LIST_OVERRIDES,
  parseMailMailboxListOverrides,
  type MailMailboxListOverrides,
} from '@/features/mail/mail-mailbox-buckets';

const STORAGE_KEY = 'nbos.mail.mailbox-list-overrides';

function readRawOverrides(raw: string | null): MailMailboxListOverrides {
  if (raw === null) {
    return { ...EMPTY_MAIL_MAILBOX_LIST_OVERRIDES };
  }
  try {
    return parseMailMailboxListOverrides(JSON.parse(raw) as unknown);
  } catch {
    return { ...EMPTY_MAIL_MAILBOX_LIST_OVERRIDES };
  }
}

export function useMailMailboxListOverrides(): [
  MailMailboxListOverrides,
  (next: MailMailboxListOverrides) => void,
] {
  const store = useMemo(
    () =>
      getPersistedReplaceStore<MailMailboxListOverrides>(
        STORAGE_KEY,
        EMPTY_MAIL_MAILBOX_LIST_OVERRIDES,
        readRawOverrides,
      ),
    [],
  );
  const value = useSyncExternalStore(store.subscribe, store.read, store.read);
  const setValue = useCallback(
    (next: MailMailboxListOverrides) => {
      store.replace(next);
    },
    [store],
  );
  return [value, setValue];
}
