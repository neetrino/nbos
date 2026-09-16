'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  resolvePermittedModuleEntryHref,
  type RegisteredModuleKey,
} from '@/lib/navigation/module-last-visit';
import { usePermission } from '@/lib/permissions';

type ModuleIndexRedirectProps = {
  moduleKey: RegisteredModuleKey;
};

/** Client redirect for module index routes (`/finance`, `/crm`, …). */
export function ModuleIndexRedirect({ moduleKey }: ModuleIndexRedirectProps) {
  const router = useRouter();
  const { can, isLoading } = usePermission();

  useEffect(() => {
    if (isLoading) return;
    router.replace(resolvePermittedModuleEntryHref(moduleKey, can));
  }, [can, isLoading, moduleKey, router]);

  return null;
}
