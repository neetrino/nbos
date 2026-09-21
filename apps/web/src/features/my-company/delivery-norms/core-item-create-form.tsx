'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';

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
      <FormFieldRow>
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('coreItems.label')}
          value={label}
          disabled={locked}
          onValueChange={setLabel}
        />
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('coreItems.noteOptional')}
          value={note}
          disabled={locked}
          onValueChange={setNote}
        />
      </FormFieldRow>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">{t('coreItems.noUnits')}</p>
        <Button type="submit" size="sm" disabled={locked}>
          {t('coreItems.add')}
        </Button>
      </div>
    </form>
  );
}
