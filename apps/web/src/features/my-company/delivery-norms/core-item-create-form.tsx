'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
import { Button } from '@/components/ui/button';

const FIELD_CLASS = 'min-w-0 flex-1';

export function CoreItemCreateForm({
  disabled,
  onAdd,
}: {
  disabled?: boolean;
  onAdd: (label: string, note: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <CoreItemAddButton disabled={disabled} onOpen={() => setOpen(true)} />;
  }
  return <CoreItemAddFields disabled={disabled} onAdd={onAdd} onClose={() => setOpen(false)} />;
}

function CoreItemAddButton({ disabled, onOpen }: { disabled?: boolean; onOpen: () => void }) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-xs">{t('coreItems.noUnits')}</p>
      <Button type="button" size="sm" disabled={disabled} onClick={onOpen}>
        {t('coreItems.add')}
      </Button>
    </div>
  );
}

function CoreItemAddFields({
  disabled,
  onAdd,
  onClose,
}: {
  disabled?: boolean;
  onAdd: (label: string, note: string) => boolean;
  onClose: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  const tCommon = useTranslations('common');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const locked = Boolean(disabled);
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!onAdd(label, note)) return;
        onClose();
      }}
    >
      <InlineField
        variant="controlled"
        className={FIELD_CLASS}
        label={t('coreItems.label')}
        value={label}
        disabled={locked}
        onValueChange={setLabel}
      />
      <InlineField
        variant="controlled"
        className={FIELD_CLASS}
        label={t('coreItems.noteOptional')}
        value={note}
        disabled={locked}
        onValueChange={setNote}
      />
      <div className="flex shrink-0 gap-1">
        <Button type="button" variant="ghost" size="sm" disabled={locked} onClick={onClose}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={locked}>
          {t('coreItems.add')}
        </Button>
      </div>
    </form>
  );
}
