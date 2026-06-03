'use client';

import { useCallback, useState } from 'react';

/** Blocks browser autofill until the user focuses the field (login/password pairs). */
export function useAutofillGuard(scopeKey: string) {
  const [editable, setEditable] = useState(false);
  const [trackedScopeKey, setTrackedScopeKey] = useState(scopeKey);

  if (trackedScopeKey !== scopeKey) {
    setTrackedScopeKey(scopeKey);
    setEditable(false);
  }

  const onFocus = useCallback(() => setEditable(true), []);

  return { readOnly: !editable, onFocus, acceptChange: editable };
}
