'use client';

import type { ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_ENTITY_ICON_INLINE_CLASS,
  RELATION_PICKER_REPLACE_ZONE_CLASS,
  RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
  RELATION_PICKER_SHEET_TARGET_GROUP_CLASS,
  RELATION_PICKER_SHEET_TARGET_LABEL_CLASS,
  RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS,
} from '../detail-sheet-classes';
import type { RelationEntityKind } from './relation-picker.types';
import { RelationPickerEntityIcon } from './relation-picker-entity-icon';

type RelationPickerChipProps = {
  label: string;
  subtitle?: string | null;
  icon?: ReactNode;
  entityKind?: RelationEntityKind;
  disabled?: boolean;
  onOpen?: () => void;
  /** Opens search dropdown (empty gap + chevron). */
  onReplace?: () => void;
  /** Inline controls after the label (e.g. date + access level). */
  trailing?: ReactNode;
  onClear?: () => void;
};

function usesPersonAvatar(kind: RelationEntityKind | undefined): boolean {
  return kind === 'contact' || kind === 'employee';
}

export function RelationPickerChip({
  label,
  subtitle,
  icon,
  entityKind,
  disabled,
  onOpen,
  onReplace,
  trailing,
  onClear,
}: RelationPickerChipProps) {
  const canOpen = Boolean(onOpen) && !disabled;
  const canReplace = Boolean(onReplace) && !disabled;
  const personLeading = usesPersonAvatar(entityKind);

  const leading =
    icon ??
    (entityKind ? (
      <RelationPickerEntityIcon
        kind={entityKind}
        variant="inline"
        className={RELATION_PICKER_ENTITY_ICON_INLINE_CLASS}
      />
    ) : null);

  const sheetLabel = (
    <span className="min-w-0">
      <span className={RELATION_PICKER_SHEET_TARGET_LABEL_CLASS}>{label}</span>
      {subtitle ? (
        <span className={RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS}>{subtitle}</span>
      ) : null}
    </span>
  );

  return (
    <span className={cn(RELATION_PICKER_CHIP_SHELL_CLASS, disabled && 'opacity-60')}>
      {canOpen ? (
        <div
          className={cn(
            RELATION_PICKER_SHEET_TARGET_GROUP_CLASS,
            (trailing || !canReplace) && 'min-w-0 flex-1',
          )}
        >
          <button
            type="button"
            disabled={!canOpen}
            onClick={onOpen}
            className={cn(
              RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
              'shrink-0',
              personLeading ? 'cursor-pointer' : 'flex items-center',
            )}
            aria-label={`Open ${label}`}
          >
            {leading}
          </button>
          <button
            type="button"
            disabled={!canOpen}
            onClick={onOpen}
            className={cn(
              RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
              'min-w-0 shrink cursor-pointer text-left',
            )}
            aria-label={`Open ${label}`}
          >
            {sheetLabel}
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'flex min-w-0 items-center gap-2',
            !canReplace && onClear && 'flex-1',
            canReplace ? 'shrink' : undefined,
          )}
        >
          {leading}
          {sheetLabel}
        </div>
      )}

      {canReplace ? (
        <button
          type="button"
          disabled={!canReplace}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onReplace?.();
          }}
          className={RELATION_PICKER_REPLACE_ZONE_CLASS}
          aria-label={`Change ${label}`}
        >
          <ChevronDown size={16} className="shrink-0 opacity-80" aria-hidden />
        </button>
      ) : null}

      {trailing ? (
        <span
          className="flex shrink-0 items-center gap-2"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {trailing}
        </span>
      ) : null}

      {onClear ? (
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          className={cn(
            DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
            'shrink-0',
            !trailing && !canReplace && 'ml-auto',
          )}
          aria-label={`Remove ${label}`}
        >
          <X size={14} />
        </button>
      ) : null}
    </span>
  );
}
