'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
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
  const locked = !canToggle || saving;

  return (
    <div className={cn('flex min-w-0 items-center gap-3', locked && 'opacity-60')}>
      <Switch
        size="lg"
        className="shrink-0"
        checked={enabled}
        disabled={locked}
        aria-label={t('enrollment.title')}
        onCheckedChange={(next) => {
          void toggleEnrollment({
            next: Boolean(next),
            fallback: t('errors.enrollment'),
            onChanged,
            onError,
            setSaving,
          });
        }}
      />
      <p className="text-muted-foreground min-w-0 text-sm">{t('enrollment.summary')}</p>
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
