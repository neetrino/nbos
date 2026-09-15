'use client';

import { AccessDeniedScreen } from '@/components/shared/AccessDeniedScreen';
import { ErrorState } from '@/components/shared/ErrorState';
import { isPermissionDeniedMessage } from '@/lib/api-errors';
import { usePermission } from '@/lib/permissions';

interface QueryLoadErrorProps {
  description: string;
  onRetry?: () => void;
}

/** 403 → Access Denied; other failures keep the retry ErrorState. */
export function QueryLoadError({ description, onRetry }: QueryLoadErrorProps) {
  const { can } = usePermission();

  if (isPermissionDeniedMessage(description)) {
    return <AccessDeniedScreen showDashboardLink={can('VIEW', 'DASHBOARDS')} />;
  }

  return <ErrorState description={description} onRetry={onRetry} />;
}
