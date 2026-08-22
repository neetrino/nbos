'use client';

import { useQuery } from '@tanstack/react-query';
import { aiAdminApi } from '@/lib/api/ai-admin';
import { formatDisableImpact, isDisableImpactConfirmReady } from '../disable-impact';
import { AiAdminConfirmDialog } from './AiAdminConfirmDialog';

const IMPACT_LOADING = 'Loading dependent Model Policies and Internal Agents…';

export function DisableImpactConfirm(props: {
  open: boolean;
  kind: 'model' | 'policy' | 'provider';
  targetId: string | null;
  title: string;
  confirmLabel: string;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const impact = useQuery({
    enabled: props.open && props.targetId !== null,
    queryKey: ['ai-admin', 'disable-impact', props.kind, props.targetId],
    queryFn: () => aiAdminApi.getDisableImpact(props.kind, props.targetId ?? ''),
    staleTime: 0,
  });
  const description = impact.isFetching
    ? IMPACT_LOADING
    : impact.data
      ? formatDisableImpact(impact.data)
      : impact.isError
        ? 'Dependent policies and Internal Agents could not be loaded. Confirm stays blocked.'
        : IMPACT_LOADING;

  return (
    <AiAdminConfirmDialog
      open={props.open}
      title={props.title}
      description={description}
      confirmLabel={props.confirmLabel}
      destructive
      isSubmitting={props.isSubmitting}
      confirmDisabled={
        !isDisableImpactConfirmReady({
          hasData: impact.data !== undefined,
          isError: impact.isError,
          isFetching: impact.isFetching,
        })
      }
      onOpenChange={props.onOpenChange}
      onConfirm={props.onConfirm}
    />
  );
}
