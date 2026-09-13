'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { APP_INSTALL_COPY_FEEDBACK_MS } from './app-install-constants';
import { buildInstallAbsoluteUrl } from './app-install-catalog';

export function useCopyInstallUrl(): {
  copiedId: string | null;
  copyPath: (id: string, path: string) => Promise<void>;
} {
  const t = useTranslations('quick');
  const tCommon = useTranslations('common');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const copyPath = useCallback(
    async (id: string, path: string) => {
      const url = buildInstallAbsoluteUrl(window.location.origin, path);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(id);
        toast.success(t('install.copied'));
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          setCopiedId((current) => (current === id ? null : current));
        }, APP_INSTALL_COPY_FEEDBACK_MS);
      } catch {
        toast.error(tCommon('sheet.copyFailed'));
      }
    },
    [t, tCommon],
  );

  return { copiedId, copyPath };
}
