'use client';

import { FolderKanban, Layers, LayoutGrid, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS,
  DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_ENTITY_ICON_INLINE_CLASS,
  RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
  RELATION_PICKER_SHEET_TARGET_GROUP_CLASS,
  RELATION_PICKER_SHEET_TARGET_LABEL_CLASS,
  RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';
import type { TaskDeliveryContextKind } from '../utils/search-task-delivery-context';

export const TASK_LINKED_TO_LABEL = 'Linked to';
export const TASK_LINKED_TO_PLACEHOLDER = 'Link project, product or work space…';

export function LinkedToNotchCaption({ locked, onAdd }: { locked: boolean; onAdd: () => void }) {
  const t = useTranslations('tasks');
  if (locked) {
    return <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>{t('sheet.linked.label')}</span>;
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className={DETAIL_SHEET_OUTLINED_ADD_BTN_CLASS}
      aria-label={t('sheet.linked.placeholder')}
    >
      <Plus size={12} aria-hidden className={DETAIL_SHEET_OUTLINED_ADD_PLUS_CLASS} />
      {t('sheet.linked.label')}
    </button>
  );
}

export function LinkedContextChip({
  kind,
  label,
  contextLabel,
  locked,
  onOpen,
  onUnlink,
}: {
  kind: TaskDeliveryContextKind;
  label: string;
  contextLabel: string | null;
  locked: boolean;
  onOpen: () => void;
  onUnlink: () => void;
}) {
  const t = useTranslations('tasks');
  const Icon = kind === 'PRODUCT' ? Layers : kind === 'WORK_SPACE' ? LayoutGrid : FolderKanban;

  return (
    <li className={cn(RELATION_PICKER_CHIP_SHELL_CLASS, locked && 'opacity-60')}>
      <div className={cn(RELATION_PICKER_SHEET_TARGET_GROUP_CLASS, 'min-w-0 flex-1')}>
        <button
          type="button"
          onClick={onOpen}
          className={cn(RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS, 'flex shrink-0 items-center')}
          aria-label={t('sheet.linked.openAria', { label })}
        >
          <Icon size={16} className={RELATION_PICKER_ENTITY_ICON_INLINE_CLASS} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onOpen}
          className={cn(RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS, 'min-w-0 flex-1 text-left')}
          aria-label={t('sheet.linked.openAria', { label })}
        >
          <span className="block w-full min-w-0">
            {contextLabel ? (
              <span className={RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS}>{contextLabel}</span>
            ) : null}
            <span className={RELATION_PICKER_SHEET_TARGET_LABEL_CLASS}>{label}</span>
          </span>
        </button>
      </div>
      {!locked ? (
        <button
          type="button"
          onClick={onUnlink}
          className={cn(DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS, 'shrink-0')}
          title={t('sheet.linked.unlink')}
          aria-label={t('sheet.linked.unlinkAria', { label })}
        >
          <X size={14} />
        </button>
      ) : null}
    </li>
  );
}
