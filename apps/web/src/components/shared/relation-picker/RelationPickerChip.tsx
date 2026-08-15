'use client';

import type { ReactNode } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DETAIL_SHEET_FIELD_CLEAR_BTN_CLASS,
  DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
  RELATION_PICKER_CHIP_SHELL_CLASS,
  RELATION_PICKER_REPLACE_ZONE_CLASS,
  RELATION_PICKER_REPLACE_ZONE_GROW_CLASS,
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
  imageUrl?: string | null;
};

function usesPersonAvatar(kind: RelationEntityKind | undefined): boolean {
  return kind === 'contact' || kind === 'employee';
}

function relationChipLeading(
  entityKind: RelationEntityKind | undefined,
  label: string,
  icon: ReactNode | undefined,
  imageUrl?: string | null,
): ReactNode {
  if (icon) return icon;
  if (!entityKind) return null;
  return relationPickerOptionLeading(entityKind, label, 'inline', imageUrl ?? undefined);
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
  imageUrl,
}: RelationPickerChipProps) {
  const canOpen = Boolean(onOpen) && !disabled;
  const canReplace = Boolean(onReplace) && !disabled;
  const personLeading = usesPersonAvatar(entityKind);

  const leading = relationChipLeading(entityKind, label, icon, imageUrl);

  const labelClass = cn(RELATION_PICKER_SHEET_TARGET_LABEL_CLASS, 'font-semibold');

  /** Person chips: no ellipsis — button flex quirks + truncate cut names short with empty space left. */
  const personLabelClass = cn(
    'text-foreground block font-semibold whitespace-nowrap transition-colors',
    'group-hover/open:text-sky-600 group-focus-within/open:text-sky-600',
    'dark:group-hover/open:text-sky-400 dark:group-focus-within/open:text-sky-400',
  );

  const sheetLabel =
    labelAddon && subtitle ? (
      <span className="flex w-full min-w-0 items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className={labelClass}>{label}</span>
          <span className={RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS}>{subtitle}</span>
        </span>
        <span className="shrink-0">{labelAddon}</span>
      </span>
    ) : (
      <span className="block w-full min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={labelClass}>{label}</span>
          {labelAddon}
        </span>
        {subtitle ? (
          <span className={RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS}>{subtitle}</span>
        ) : null}
      </span>
    );

  const personIdentity = (
    <span className="min-w-0 flex-1 text-left">
      <span className={personLabelClass}>{label}</span>
      {subtitle ? (
        <span
          className={cn(
            RELATION_PICKER_SHEET_TARGET_SUBTITLE_CLASS,
            'overflow-visible whitespace-nowrap',
          )}
        >
          {subtitle}
        </span>
      ) : null}
    </span>
  );

  const replaceButton = canReplace ? (
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
      className={cn(
        RELATION_PICKER_REPLACE_ZONE_CLASS,
        personLeading ? 'flex-none' : RELATION_PICKER_REPLACE_ZONE_GROW_CLASS,
      )}
      aria-label={`Change ${label}`}
    >
      <ChevronDown size={16} className="shrink-0 opacity-80" aria-hidden />
    </button>
  ) : null;

  const trailingSlot = trailing ? (
    <span
      className="flex shrink-0 items-center gap-2"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {trailing}
    </span>
  ) : null;

  const clearButton = onClear ? (
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
  ) : null;

  // Avatar + name in one horizontal row. Grow a div (not the <button>) — buttons
  // ignore flex-1 width in several browsers, which made truncate ellipsis too early.
  if (personLeading) {
    const personOpenBody = (
      <>
        <span className="shrink-0">{leading}</span>
        {personIdentity}
        {labelAddon ? <span className="shrink-0">{labelAddon}</span> : null}
      </>
    );

    return (
      <div
        className={cn(
          PERSON_CONTACT_ROW_CLASS,
          DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS,
          'group/open gap-2 pr-1',
          disabled && 'opacity-60',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center">
          {canOpen ? (
            <button
              type="button"
              disabled={!canOpen}
              onClick={onOpen}
              className={cn(
                RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS,
                'flex w-full min-w-0 items-center gap-2.5 text-left',
              )}
              aria-label={`Open ${label}`}
            >
              {personOpenBody}
            </button>
          ) : (
            <div className="flex w-full min-w-0 items-center gap-2.5">{personOpenBody}</div>
          )}
        </div>
        {replaceButton}
        {trailingSlot}
        {clearButton}
      </div>
    );
  }

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
            className={cn(RELATION_PICKER_SHEET_TARGET_BUTTON_CLASS, 'flex shrink-0 items-center')}
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

      {replaceButton}
      {trailingSlot}
      {clearButton}
    </span>
  );
}
