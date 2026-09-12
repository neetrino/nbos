'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { setPermissionDeniedCopy } from '@/lib/permissions/permission-denied';

/** Syncs the interceptor 403 toast with the active catalog. */
export function PermissionDeniedCopySync() {
  const t = useTranslations('common');
  const message = t('permissionDenied');

  useEffect(() => {
    setPermissionDeniedCopy(message);
  }, [message]);

  return null;
}
