'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { DeliveryNormsFormBlock } from './delivery-norms-form-block';
import { messageFromCaught } from './message-from-caught';
import { parsePositiveDecimal } from './sale-price-draft';

export function DefaultMultiplierForm({
  value,
  canEdit,
  onChanged,
  onError,
}: {
  value: string | null;
  canEdit: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <DeliveryNormsFormBlock title={t('salePrices.defaultTitle')}>
      <p className="text-muted-foreground text-xs">{t('salePrices.defaultSubtitle')}</p>
      <InlineField
        variant="controlled"
        label={t('salePrices.multiplier')}
        value={draft}
        disabled={!canEdit || saving}
        onValueChange={setDraft}
      />
      {canEdit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={() => {
              void submitDefaultMultiplier({
                draft,
                fallback: t('errors.defaultMultiplier'),
                notPositive: t('errors.salePricePositive'),
                onError,
                onChanged,
                setSaving,
              });
            }}
          >
            {saving ? t('salePrices.savingDefault') : t('salePrices.defaultSave')}
          </Button>
        </div>
      ) : null}
    </DeliveryNormsFormBlock>
  );
}

async function submitDefaultMultiplier(input: {
  draft: string;
  fallback: string;
  notPositive: string;
  onError: (message: string) => void;
  onChanged: () => void;
  setSaving: (value: boolean) => void;
}): Promise<void> {
  const multiplier = parsePositiveDecimal(input.draft);
  if (multiplier === null) {
    input.onError(input.notPositive);
    return;
  }
  input.setSaving(true);
  try {
    await deliveryCatalogStructureApi.setDefaultMultiplier(multiplier);
    input.onChanged();
  } catch (caught) {
    input.onError(messageFromCaught(caught, input.fallback));
  } finally {
    input.setSaving(false);
  }
}
