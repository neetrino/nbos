'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CreateFormSwitchField } from '@/components/shared';
import { deliveryNormsApi, type DeliveryEnrollmentSetting } from '@/lib/api/delivery-norms';
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-foreground text-sm font-medium">{t('enrollment.title')}</p>
        <p className="text-muted-foreground text-xs">{t('enrollment.hint')}</p>
      </div>
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
    </div>
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
