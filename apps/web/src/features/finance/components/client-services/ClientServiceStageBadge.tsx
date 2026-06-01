'use client';

import { StatusBadge } from '@/components/shared';
import {
  CLIENT_SERVICE_OVERDUE_LABEL,
  CLIENT_SERVICE_OVERDUE_VARIANT,
  clientServiceStageLabel,
  clientServiceStageVariant,
} from '@/features/finance/constants/client-service-payment-stage';
import type { ClientServiceRecord } from '@/lib/api/client-services';

interface ClientServiceStageBadgeProps {
  service: Pick<ClientServiceRecord, 'paymentStage' | 'overdue'>;
  emptyLabel?: string;
}

export function ClientServiceStageBadge({ service, emptyLabel }: ClientServiceStageBadgeProps) {
  if (service.overdue) {
    return (
      <StatusBadge label={CLIENT_SERVICE_OVERDUE_LABEL} variant={CLIENT_SERVICE_OVERDUE_VARIANT} />
    );
  }
  if (!service.paymentStage) {
    return emptyLabel ? <span className="text-muted-foreground text-xs">{emptyLabel}</span> : null;
  }
  return (
    <StatusBadge
      label={clientServiceStageLabel(service.paymentStage)}
      variant={clientServiceStageVariant(service.paymentStage)}
    />
  );
}
