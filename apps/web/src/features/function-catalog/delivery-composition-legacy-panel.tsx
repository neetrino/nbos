'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { deliveryConfigurationsApi } from '@/lib/api/delivery-configurations';
import type { FunctionsWorkspaceTarget } from './product-functions-workspace-data';

export function DeliveryCompositionLegacyPanel({
  target,
  orderId,
  canEdit,
  onAdopted,
}: {
  target: FunctionsWorkspaceTarget;
  orderId: string | null;
  canEdit: boolean;
  onAdopted: () => void;
}) {
  const t = useTranslations('hr.functionCatalog');
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{t('legacySkip')}</p>
      {canEdit && !orderId ? (
        <p className="text-muted-foreground text-sm">{t('adoptNeedsOrder')}</p>
      ) : null}
      {canEdit ? (
        <Button
          type="button"
          disabled={!orderId || busy}
          onClick={() => void adoptV2(target, orderId, t('adoptFailed'), setBusy, onAdopted)}
        >
          {busy ? t('adoptingV2') : t('adoptV2')}
        </Button>
      ) : null}
    </div>
  );
}

async function adoptV2(
  target: FunctionsWorkspaceTarget,
  orderId: string | null,
  fallback: string,
  setBusy: (busy: boolean) => void,
  onAdopted: () => void,
): Promise<void> {
  if (!orderId) return;
  setBusy(true);
  try {
    if (target.kind === 'extension') {
      await deliveryConfigurationsApi.enrollExtension(target.id, orderId);
    } else {
      await deliveryConfigurationsApi.enrollProduct(target.id, orderId);
    }
    onAdopted();
  } catch (error) {
    toast.error(getApiErrorMessage(error, fallback));
  } finally {
    setBusy(false);
  }
}
