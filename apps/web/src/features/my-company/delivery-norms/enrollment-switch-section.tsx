'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormSwitchField } from '@/components/shared';
import { deliveryNormsApi, type DeliveryEnrollmentSetting } from '@/lib/api/delivery-norms';
import { DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID } from './delivery-norms-workspace';
import { DeliveryNormsSectionCard } from './delivery-norms-section-card';
import { messageFromCaught } from './message-from-caught';

export function EnrollmentSwitchSection({
  setting,
  canToggle,
  onChanged,
  onError,
}: {
  setting: DeliveryEnrollmentSetting | null;
  canToggle: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [saving, setSaving] = useState(false);
  const enabled = setting?.newEnrollmentEnabled ?? false;

  return (
    <DeliveryNormsSectionCard title={t('enrollment.title')} description={t('enrollment.subtitle')}>
      <div id={DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID} className="space-y-3">
        <CreateFormSwitchField
          label={enabled ? t('enrollment.stateOn') : t('enrollment.stateOff')}
          checked={enabled}
          disabled={!canToggle || saving}
          onCheckedChange={(next) => {
            void toggleEnrollment({
              next,
              fallback: t('errors.enrollment'),
              onChanged,
              onError,
              setSaving,
            });
          }}
        />
        {setting?.updatedAt ? (
          <p className="text-muted-foreground text-xs">
            {t('enrollment.updatedAt', { at: setting.updatedAt })}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">{t('enrollment.hint')}</p>
      </div>
    </DeliveryNormsSectionCard>
  );
}

async function toggleEnrollment(input: {
  next: boolean;
  fallback: string;
  onChanged: () => void;
  onError: (message: string) => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  input.setSaving(true);
  try {
    await deliveryNormsApi.setEnrollment(input.next);
    input.onChanged();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
