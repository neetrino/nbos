'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NormField } from './norm-field';
import { PROFILE_FORM_GRID_CLASS } from './delivery-norms.constants';

export function CoreItemCreateForm({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd: (label: string, note: string) => boolean;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const locked = Boolean(disabled);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!onAdd(label, note)) {
          return;
        }
        setLabel('');
        setNote('');
      }}
    >
      <h3 className="text-foreground text-sm font-semibold">{t('coreItems.addTitle')}</h3>
      <div className={PROFILE_FORM_GRID_CLASS}>
        <NormField label={t('coreItems.label')}>
          <Input
            value={label}
            disabled={locked}
            onChange={(event) => setLabel(event.target.value)}
          />
        </NormField>
        <NormField label={t('coreItems.noteOptional')}>
          <Input value={note} disabled={locked} onChange={(event) => setNote(event.target.value)} />
        </NormField>
      </div>
      <p className="text-muted-foreground text-xs">{t('coreItems.noUnits')}</p>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={locked}>
          {t('coreItems.add')}
        </Button>
      </div>
    </form>
  );
}
