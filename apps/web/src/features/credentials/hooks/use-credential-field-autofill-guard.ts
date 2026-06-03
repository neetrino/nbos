'use client';

import { useCallback, useEffect, useState } from 'react';

/** Blocks browser autofill until the user focuses the field (login/password pairs). */
export function useAutofillGuard(scopeKey: string) {
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    setEditable(false);
  }, [scopeKey]);

  const onFocus = useCallback(() => setEditable(true), []);

  return { readOnly: !editable, onFocus, acceptChange: editable };
}
