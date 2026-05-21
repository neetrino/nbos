'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { readModuleEntryHref, type RegisteredModuleKey } from '@/lib/navigation/module-last-visit';

type ModuleIndexRedirectProps = {
  moduleKey: RegisteredModuleKey;
};

/** Client redirect for module index routes (`/finance`, `/crm`, …). */
export function ModuleIndexRedirect({ moduleKey }: ModuleIndexRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(readModuleEntryHref(moduleKey));
  }, [router, moduleKey]);

  return null;
}
