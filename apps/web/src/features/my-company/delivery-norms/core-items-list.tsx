'use client';

import { useTranslations } from 'next-intl';
import { FormFieldRow, InlineField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import { Button } from '@/components/ui/button';
import { DeliveryNormsRecordRow } from './delivery-norms-record-row';
import {
  moveCoreItemDraft,
  removeCoreItemDraft,
  replaceCoreItemDraft,
  type CoreItemDraft,
} from './core-item-draft';

export function CoreItemsList({
  drafts,
  disabled,
  onChange,
}: {
  drafts: CoreItemDraft[];
  disabled: boolean;
  onChange: (next: CoreItemDraft[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  if (drafts.length === 0) {
    return <p className="text-muted-foreground text-sm">{t('coreItems.empty')}</p>;
  }
  return (
    <ul className="space-y-3">
      {drafts.map((row, index) => (
        <CoreItemRow
          key={row.key}
          row={row}
          index={index}
          lastIndex={drafts.length - 1}
          disabled={disabled}
          onChange={onChange}
          drafts={drafts}
        />
      ))}
    </ul>
  );
}

function CoreItemRow({
  row,
  index,
  lastIndex,
  disabled,
  drafts,
  onChange,
}: {
  row: CoreItemDraft;
  index: number;
  lastIndex: number;
  disabled: boolean;
  drafts: CoreItemDraft[];
  onChange: (next: CoreItemDraft[]) => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <DeliveryNormsRecordRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('coreItems.label')}
          value={row.label}
          disabled={disabled}
          onValueChange={(label) => onChange(replaceCoreItemDraft(drafts, row.key, { label }))}
        />
        <InlineField
          variant="controlled"
          className={FORM_FIELD_CELL_CLASS}
          label={t('coreItems.note')}
          value={row.note}
          disabled={disabled}
          onValueChange={(note) => onChange(replaceCoreItemDraft(drafts, row.key, { note }))}
        />
      </FormFieldRow>
      {disabled ? null : (
        <CoreItemRowActions
          index={index}
          lastIndex={lastIndex}
          onMoveUp={() => onChange(moveCoreItemDraft(drafts, row.key, 'up'))}
          onMoveDown={() => onChange(moveCoreItemDraft(drafts, row.key, 'down'))}
          onRemove={() => onChange(removeCoreItemDraft(drafts, row.key))}
        />
      )}
    </DeliveryNormsRecordRow>
  );
}

function CoreItemRowActions({
  index,
  lastIndex,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  lastIndex: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations('hr.deliveryNorms');
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={onMoveUp}>
        {t('coreItems.moveUp')}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={index === lastIndex}
        onClick={onMoveDown}
      >
        {t('coreItems.moveDown')}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        {t('coreItems.remove')}
      </Button>
    </div>
  );
}
