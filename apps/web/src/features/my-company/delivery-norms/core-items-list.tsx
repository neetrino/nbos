'use client';

import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InlineField } from '@/components/shared';
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
      <InlineField
        variant="controlled"
        className="min-w-0 flex-1"
        label={t('coreItems.label')}
        value={row.label}
        disabled={disabled}
        onValueChange={(label) => onChange(replaceCoreItemDraft(drafts, row.key, { label }))}
      />
      <InlineField
        variant="controlled"
        className="min-w-0 flex-1"
        label={t('coreItems.note')}
        value={row.note}
        disabled={disabled}
        onValueChange={(note) => onChange(replaceCoreItemDraft(drafts, row.key, { note }))}
      />
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
    <div className="flex shrink-0 gap-1">
      <CoreItemIconButton
        label={t('coreItems.moveUp')}
        disabled={index === 0}
        onClick={onMoveUp}
      >
        <ChevronUp />
      </CoreItemIconButton>
      <CoreItemIconButton
        label={t('coreItems.moveDown')}
        disabled={index === lastIndex}
        onClick={onMoveDown}
      >
        <ChevronDown />
      </CoreItemIconButton>
      <CoreItemIconButton label={t('coreItems.remove')} destructive onClick={onRemove}>
        <Trash2 />
      </CoreItemIconButton>
    </div>
  );
}

function CoreItemIconButton({
  label,
  disabled,
  destructive,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={destructive ? 'destructive' : 'outline'}
      size="icon-sm"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
