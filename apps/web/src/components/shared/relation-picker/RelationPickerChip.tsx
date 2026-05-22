'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
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
  onClear?: () => void;
};

export function RelationPickerChip({
  label,
  subtitle,
  icon,
  entityKind,
  disabled,
  onOpen,
  onClear,
}: RelationPickerChipProps) {
  const leading = icon ?? (entityKind ? <RelationPickerEntityIcon kind={entityKind} /> : null);
  return (
    <span
      className={cn(
        DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
        'border-border/60 bg-muted/30 inline-flex max-w-full min-w-0 items-center gap-2 rounded-xl border py-1.5 pr-1 pl-2.5 text-sm shadow-sm',
        disabled && 'opacity-60',
      )}
    >
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
  );
}
