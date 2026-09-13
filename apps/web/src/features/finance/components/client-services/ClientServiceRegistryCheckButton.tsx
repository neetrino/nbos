'use client';

import { useState, type MouseEvent } from 'react';
import { Loader2, Radar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { clientServiceRegistryToast } from '@/features/finance/constants/client-service-registry';
import {
  clientServicesApi,
  type ClientServiceRegistryCheckResult,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { notifyClientServiceRegistryRefresh } from './client-service-registry-events';
import {
  translateClientServiceRegistryToast,
  useClientServicesT,
} from './client-service-message-keys';

export function ClientServiceRegistryCheckButton(props: {
  serviceId: string;
  compact?: boolean;
  /** Match outlined detail-sheet field shells (`h-10 rounded-xl`). */
  matchFieldHeight?: boolean;
  disabled?: boolean;
  onChecked?: (result: ClientServiceRegistryCheckResult) => void;
}) {
  const t = useClientServicesT();
  const [checking, setChecking] = useState(false);

  async function handleClick(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (checking || props.disabled) return;
    setChecking(true);
    try {
      const result = await clientServicesApi.checkRegistry(props.serviceId);
      const notice = clientServiceRegistryToast(result.outcome);
      const message = translateClientServiceRegistryToast(t, result.outcome);
      if (notice.kind === 'success') toast.success(message);
      else if (notice.kind === 'warning') toast.warning(message);
      else toast.error(message);
      props.onChecked?.(result);
      notifyClientServiceRegistryRefresh();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t('errors.registryCheck')));
    } finally {
      setChecking(false);
    }
  }

  return (
    <Button
      type="button"
      variant={props.compact ? 'ghost' : 'outline'}
      size={props.compact ? 'icon' : props.matchFieldHeight ? 'lg' : 'sm'}
      className={props.matchFieldHeight ? 'rounded-xl' : undefined}
      disabled={checking || props.disabled}
      aria-label={t('registry.checkAria')}
      title={t('registry.checkAria')}
      onClick={(event) => void handleClick(event)}
    >
      {checking ? <Loader2 className="size-3.5 animate-spin" /> : <Radar className="size-3.5" />}
      {props.compact ? null : <span className="ml-1.5">{t('registry.check')}</span>}
    </Button>
  );
}
