'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AccessDeniedScreen } from '@/components/shared/AccessDeniedScreen';
import { LoadingState } from '@/components/shared/LoadingState';
import { resolveNavPermission } from '@/lib/navigation/resolve-nav-permission';
import { usePermission } from '@/lib/permissions';

interface ModuleAccessGateProps {
  children: ReactNode;
}

export function ModuleAccessGate({ children }: ModuleAccessGateProps) {
  const pathname = usePathname();
  const { can, isLoading, meLoadError } = usePermission();
  const required = resolveNavPermission(pathname);

  if (!required) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-6 py-16">
        <LoadingState />
      </div>
    );
  }

  if (meLoadError) {
    return <>{children}</>;
  }

  if (!can(required.action, required.module)) {
    return <AccessDeniedScreen showDashboardLink={can('VIEW', 'DASHBOARDS')} />;
  }

  return <>{children}</>;
}
