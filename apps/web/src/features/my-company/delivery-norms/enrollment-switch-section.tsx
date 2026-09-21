'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { deliveryNormsApi, type DeliveryEnrollmentSetting } from '@/lib/api/delivery-norms';
import { StatusBadge } from '@/components/shared';
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
      <div
        id={DELIVERY_NORMS_ENROLLMENT_ELEMENT_ID}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="space-y-2">
          <StatusBadge
            label={enabled ? t('enrollment.stateOn') : t('enrollment.stateOff')}
            variant={enabled ? 'emerald' : 'gray'}
          />
          {setting?.updatedAt ? (
            <p className="text-muted-foreground text-xs">
              {t('enrollment.updatedAt', { at: setting.updatedAt })}
            </p>
          ) : null}
        </div>
        {canToggle ? (
          <Button
            type="button"
            size="sm"
            variant={enabled ? 'outline' : 'default'}
            disabled={saving}
            onClick={() => {
              void toggleEnrollment({
                next: !enabled,
                fallback: t('errors.enrollment'),
                onChanged,
                onError,
                setSaving,
              });
            }}
          >
            {enabled ? t('enrollment.turnOff') : t('enrollment.turnOn')}
          </Button>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">{t('enrollment.hint')}</p>
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
