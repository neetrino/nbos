import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  deliveryConfigurationsApi,
  type ReplacementPlanDto,
} from '@/lib/api/delivery-configurations';
import { UNSELECTED_ROLE } from './replace-assignee.constants';
import { createEmptyShareDrafts, type ShareDraft } from './replace-assignee-form';

export function useReplacementPlan(configurationId: string, roleKey: string) {
  const t = useTranslations('hr.functionCatalog');
  const planFailed = t('replaceAssignee.planFailed');
  const [plan, setPlan] = useState<ReplacementPlanDto | null>(null);
  const [shares, setShares] = useState<ShareDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadPlanOrEmpty(configurationId, roleKey, planFailed);
      setPlan(next.plan);
      setShares(next.shares);
      setError(next.error);
    } finally {
      setLoading(false);
    }
  }, [configurationId, roleKey, planFailed]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { plan, shares, setShares, loading, error, setError, reload };
}

async function loadPlanOrEmpty(
  configurationId: string,
  roleKey: string,
  fallback: string,
): Promise<{ plan: ReplacementPlanDto | null; shares: ShareDraft[]; error: string | null }> {
  if (roleKey === UNSELECTED_ROLE) {
    return { plan: null, shares: [], error: null };
  }
  try {
    const plan = await deliveryConfigurationsApi.getReplacementPlan(configurationId, roleKey);
    return {
      plan,
      shares: createEmptyShareDrafts(plan.components.map((row) => row.componentId)),
      error: null,
    };
  } catch (caught) {
    return { plan: null, shares: [], error: getApiErrorMessage(caught, fallback) };
  }
}
