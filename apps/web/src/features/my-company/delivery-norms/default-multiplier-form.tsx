'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deliveryCatalogStructureApi } from '@/lib/api/delivery-catalog-structure';
import { messageFromCaught } from './message-from-caught';
import { NormField } from './norm-field';
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
    <div className="border-border space-y-3 rounded-xl border p-3">
      <div>
        <h3 className="text-foreground text-sm font-semibold">{t('salePrices.defaultTitle')}</h3>
        <p className="text-muted-foreground text-xs">{t('salePrices.defaultSubtitle')}</p>
      </div>
      <NormField label={t('salePrices.defaultTitle')}>
        <Input
          value={draft}
          disabled={!canEdit || saving}
          inputMode="decimal"
          onChange={(event) => setDraft(event.target.value)}
        />
      </NormField>
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
    </div>
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
