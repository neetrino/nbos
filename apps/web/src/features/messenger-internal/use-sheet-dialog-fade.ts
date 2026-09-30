'use client';

import { useEffect, useState } from 'react';
import { SHEET_DIALOG_FADE_MS } from './internal-messenger.constants';

export function useSheetDialogFade(
  open: boolean,
  durationMs = SHEET_DIALOG_FADE_MS,
): { mounted: boolean; visible: boolean } {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (open) {
      const start = window.setTimeout(() => {
        if (cancelled) return;
        setMounted(true);
        setVisible(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!cancelled) setVisible(true);
          });
        });
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(start);
      };
    }
    const hide = window.setTimeout(() => {
      if (!cancelled) setVisible(false);
    }, 0);
    const unmount = window.setTimeout(() => {
      if (!cancelled) setMounted(false);
    }, durationMs);
    return () => {
      cancelled = true;
      window.clearTimeout(hide);
      window.clearTimeout(unmount);
    };
  }, [durationMs, open]);

  return { mounted, visible };
}
