'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CORE_ITEM_ROW_CLASS } from './delivery-norms.constants';
import {
  moveCoreItemDraft,
  removeCoreItemDraft,
  replaceCoreItemDraft,
  type CoreItemDraft,
} from './core-item-draft';
import { NormField } from './norm-field';

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
    <li className="border-border space-y-2 rounded-xl border p-3">
      <div className={CORE_ITEM_ROW_CLASS}>
        <NormField label={t('coreItems.label')}>
          <Input
            value={row.label}
            disabled={disabled}
            onChange={(event) =>
              onChange(replaceCoreItemDraft(drafts, row.key, { label: event.target.value }))
            }
          />
        </NormField>
        <NormField label={t('coreItems.note')}>
          <Input
            value={row.note}
            disabled={disabled}
            onChange={(event) =>
              onChange(replaceCoreItemDraft(drafts, row.key, { note: event.target.value }))
            }
          />
        </NormField>
        {disabled ? null : (
          <CoreItemRowActions
            index={index}
            lastIndex={lastIndex}
            onMoveUp={() => onChange(moveCoreItemDraft(drafts, row.key, 'up'))}
            onMoveDown={() => onChange(moveCoreItemDraft(drafts, row.key, 'down'))}
            onRemove={() => onChange(removeCoreItemDraft(drafts, row.key))}
          />
        )}
      </div>
    </li>
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
    <div className="flex flex-wrap gap-1">
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
