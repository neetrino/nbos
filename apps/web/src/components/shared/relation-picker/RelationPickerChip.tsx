'use client';

import type { ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_REPLACE_ZONE_CLASS,
  RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
  RELATION_PICKER_SHEET_TARGET_GROUP_CLASS,
  RELATION_PICKER_SHEET_TARGET_LABEL_CLASS,
  RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS,
} from '../detail-sheet-classes';
import { PERSON_CONTACT_ROW_CLASS } from '../person-contact-row.constants';
import type { RelationEntityKind } from './relation-picker.types';
import { relationPickerOptionLeading } from './relation-picker-entity-icon';

type RelationPickerChipProps = {
  label: string;
  /** Inline content next to the label (e.g. employee status badge). */
  labelAddon?: ReactNode;
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

function relationChipLeading(
  entityKind: RelationEntityKind | undefined,
  label: string,
  icon: ReactNode | undefined,
): ReactNode {
  if (icon) return icon;
  if (!entityKind) return null;
  return relationPickerOptionLeading(entityKind, label, 'inline');
}

export function RelationPickerChip({
  label,
  labelAddon,
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

  const leading = relationChipLeading(entityKind, label, icon);

  const sheetLabel =
    labelAddon && subtitle ? (
      <span className="flex min-w-0 items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className={cn(RELATION_PICKER_SHEET_TARGET_LABEL_CLASS, 'truncate font-semibold')}>
            {label}
          </span>
          <span className={RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS}>{subtitle}</span>
        </span>
        <span className="shrink-0">{labelAddon}</span>
      </span>
    ) : (
      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className={cn(RELATION_PICKER_SHEET_TARGET_LABEL_CLASS, 'truncate font-semibold')}>
            {label}
          </span>
          {labelAddon}
        </span>
        {subtitle ? (
          <span className={RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS}>{subtitle}</span>
        ) : null}
      </span>
    );

  return (
    <span
      className={cn(
        personLeading ? PERSON_CONTACT_ROW_CLASS : RELATION_PICKER_CHIP_SHELL_CLASS,
        personLeading && 'gap-2 pr-1',
        disabled && 'opacity-60',
      )}
    >
      {canOpen ? (
        <div
          className={cn(
            RELATION_PICKER_SHEET_TARGET_GROUP_CLASS,
            (trailing || !canReplace || personLeading) && 'min-w-0 flex-1',
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
              'min-w-0 cursor-pointer text-left',
              personLeading ? 'flex-1' : 'shrink',
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
            canReplace && !personLeading ? 'shrink' : undefined,
            personLeading && 'min-w-0 flex-1',
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
          className={cn(RELATION_PICKER_REPLACE_ZONE_CLASS, personLeading && 'min-w-0 flex-none')}
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
