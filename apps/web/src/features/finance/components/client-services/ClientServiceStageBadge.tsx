'use client';

import { StatusBadge } from '@/components/shared';
import {
  CLIENT_SERVICE_OVERDUE_VARIANT,
  clientServiceStageVariant,
} from '@/features/finance/constants/client-service-payment-stage';
import { translateClientServiceStage, useClientServicesT } from './client-service-message-keys';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import { cn } from '@/lib/utils';

interface ClientServiceStageBadgeProps {
  service: Pick<ClientServiceRecord, 'paymentStage' | 'overdue'>;
  emptyLabel?: string;
  className?: string;
}

const STAGE_BADGE_CLASS = 'rounded-full px-2.5 text-[10px] font-semibold tracking-wide';

export function ClientServiceStageBadge({
  service,
  emptyLabel,
  className,
}: ClientServiceStageBadgeProps) {
  const t = useClientServicesT();
  const badgeClass = cn(STAGE_BADGE_CLASS, className);

  if (service.overdue) {
    return (
      <StatusBadge
        label={t('stage.overdue')}
        variant={CLIENT_SERVICE_OVERDUE_VARIANT}
        className={badgeClass}
      />
    );
  }
  if (!service.paymentStage) {
    return emptyLabel ? <span className="text-muted-foreground text-xs">{emptyLabel}</span> : null;
  }
  return (
    <StatusBadge
      label={translateClientServiceStage(t, service.paymentStage)}
      variant={clientServiceStageVariant(service.paymentStage)}
      className={badgeClass}
    />
  );
}
