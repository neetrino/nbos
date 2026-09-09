import { StatusBadge } from '@/components/shared';
import { clientServiceRegistryBadge } from '@/features/finance/constants/client-service-registry';
import type { ClientServiceRegistryLookupStatus } from '@/lib/api/client-services';

export function ClientServiceRegistryBadge(props: {
  status: ClientServiceRegistryLookupStatus | null | undefined;
  className?: string;
}) {
  const badge = clientServiceRegistryBadge(props.status);
  if (!badge) return null;
  return (
    <StatusBadge
      label={badge.label}
      variant={badge.variant === 'red' ? 'red' : 'amber'}
      className={props.className}
    />
  );
}
