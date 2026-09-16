'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AccessDeniedScreen } from '@/components/shared/AccessDeniedScreen';
import { ErrorState } from '@/components/shared/ErrorState';
import { LoadingState } from '@/components/shared/LoadingState';
import { hasNavPermission } from '@/lib/navigation/nav-visibility';
import { resolveNavPermission } from '@/lib/navigation/resolve-nav-permission';
import { usePermission } from '@/lib/permissions';
import { resolveModuleAccessDecision } from './module-access-decision';

interface ModuleAccessGateProps {
  children: ReactNode;
}

export function ModuleAccessGate({ children }: ModuleAccessGateProps) {
  const pathname = usePathname();
  const { can, isLoading, meLoadError, reloadMe } = usePermission();
  const required = resolveNavPermission(pathname);

  const decision = resolveModuleAccessDecision({
    hasRequirement: Boolean(required),
    isLoading,
    meLoadError,
    isPermitted: hasNavPermission(required, can),
  });

  if (decision === 'LOADING') {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-6 py-16">
        <LoadingState />
      </div>
    );
  }

  if (decision === 'ERROR') {
    return (
      <div className="px-6 py-16">
        <ErrorState description={meLoadError ?? ''} onRetry={reloadMe} />
      </div>
    );
  }

  if (decision === 'DENY') {
    return <AccessDeniedScreen showDashboardLink={can('VIEW', 'DASHBOARDS')} />;
  }

  return <>{children}</>;
}
