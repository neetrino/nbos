'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeliveryRoleUnitFinancialDto } from '@nbos/shared';
import { Button } from '@/components/ui/button';
import { messageFromCaught } from './message-from-caught';
import { publishWithZeroUnitsConfirmation } from './publish-zero-units';

export function PublishDraftButton({
  disabled,
  roleUnits,
  onPublish,
  onError,
  onPublished,
}: {
  disabled?: boolean;
  roleUnits?: readonly DeliveryRoleUnitFinancialDto[];
  onPublish: (confirmZeroUnits: boolean) => Promise<void>;
  onError: (message: string) => void;
  onPublished: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [busy, setBusy] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      disabled={disabled || busy}
      onClick={() => {
        void (async () => {
          setBusy(true);
          try {
            const result = await publishWithZeroUnitsConfirmation(
              roleUnits ?? [],
              t('publish.confirmZeroUnits'),
              onPublish,
            );
            if (result === 'cancelled') {
              return;
            }
            onPublished();
          } catch (caught) {
            onError(messageFromCaught(caught, t('errors.publish')));
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      {busy ? t('publish.publishing') : t('publish.action')}
    </Button>
  );
}
