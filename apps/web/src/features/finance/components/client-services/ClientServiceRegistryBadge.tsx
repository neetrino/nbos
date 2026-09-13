'use client';

import { StatusBadge } from '@/components/shared';
import { clientServiceRegistryBadge } from '@/features/finance/constants/client-service-registry';
import type { ClientServiceRegistryLookupStatus } from '@/lib/api/client-services';
import { useClientServicesT } from './client-service-message-keys';

export function ClientServiceRegistryBadge(props: {
  status: ClientServiceRegistryLookupStatus | null | undefined;
  className?: string;
}) {
  const t = useClientServicesT();
  const badge = clientServiceRegistryBadge(props.status);
  if (!badge) return null;
  const label = props.status === 'NOT_FOUND' ? t('registry.dead') : t('registry.noData');
  return (
    <StatusBadge
      label={label}
      variant={badge.variant === 'red' ? 'red' : 'amber'}
      className={props.className}
    />
  );
}
