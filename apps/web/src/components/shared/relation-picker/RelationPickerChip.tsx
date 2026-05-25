'use client';

import type { ReactNode } from 'react';
import { Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
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
  /** Opens search dropdown to pick another entity (required fields). */
  onReplace?: () => void;
  onClear?: () => void;
};

export function RelationPickerChip({
  label,
  subtitle,
  icon,
  entityKind,
  disabled,
  onOpen,
  onReplace,
  onClear,
}: RelationPickerChipProps) {
  const leading = icon ?? (entityKind ? <RelationPickerEntityIcon kind={entityKind} /> : null);
  return (
    <span className={cn(RELATION_PICKER_CHIP_SHELL_CLASS, disabled && 'opacity-60')}>
      <button
        type="button"
        disabled={disabled || !onOpen}
        onClick={onOpen}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 text-left',
          onOpen && !disabled && 'hover:opacity-90',
          (!onOpen || disabled) && 'cursor-default',
        )}
      >
        {leading}
        <span className="min-w-0">
          <span className="text-foreground block truncate font-medium">{label}</span>
          {subtitle ? (
            <span className="text-muted-foreground block truncate text-[11px]">{subtitle}</span>
          ) : null}
        </span>
      </button>
      <span className="flex shrink-0 items-center gap-0.5">
        {onReplace ? (
          <button
            type="button"
            disabled={disabled}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onReplace();
            }}
            className={cn(
              'hover:bg-muted/50 flex size-7 items-center justify-center rounded-md',
              DETAIL_SHEET_FIELD_PENCIL_ICON_CLASS,
            )}
            aria-label={`Change ${label}`}
          >
            <Pencil size={14} />
          </button>
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
            className={DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS}
            aria-label={`Remove ${label}`}
          >
            <X size={14} />
          </button>
        ) : null}
      </span>
    </span>
  );
}
