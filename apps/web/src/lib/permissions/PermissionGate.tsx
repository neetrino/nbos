'use client';

import type { ReactNode } from 'react';
import { usePermission } from './PermissionContext';

interface PermissionGateProps {
  module: string;
  action: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ module, action, fallback = null, children }: PermissionGateProps) {
  const { can, isLoading } = usePermission();

  if (isLoading) return null;
  if (!can(action, module)) return <>{fallback}</>;
  return <>{children}</>;
}
