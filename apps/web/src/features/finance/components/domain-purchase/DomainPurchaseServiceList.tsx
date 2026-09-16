'use client';

import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import type { ClientServiceRecord } from '@/lib/api/client-services';

interface DomainPurchaseServiceListProps {
  services: readonly ClientServiceRecord[];
  onOpenService: (serviceId: string) => void;
}

export function DomainPurchaseServiceList({
  services,
  onOpenService,
}: DomainPurchaseServiceListProps) {
  const t = useClientServicesT();
  if (services.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {services.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            className="hover:bg-muted/70 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm"
            onClick={() => onOpenService(row.id)}
          >
            <span className="truncate font-medium">{row.name}</span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {t('domainPurchase.openService')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
