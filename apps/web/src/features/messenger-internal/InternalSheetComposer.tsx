'use client';

import type { KeyboardEvent } from 'react';
import {
  SHEET_COMPOSER_FIELD_BASE_CLASS,
  SHEET_COMPOSER_GUTTER_CLASS,
  SHEET_COMPOSER_MAX_ROWS,
  SHEET_COMPOSER_RADIUS_BY_ROWS,
  SHEET_COMPOSER_TEXTAREA_CLASS,
  SHEET_COMPOSER_WRAP_CHAR_COUNT,
} from './internal-messenger.constants';
import { useSheetMessengerPalette } from './sheet-messenger-palette';

const CLIP_ICON = '/messenger/sheet-composer-clip.svg';
const STICKER_ICON = '/messenger/sheet-composer-sticker.svg';
const SEND_ICON = '/messenger/sheet-composer-send.svg';
const ROUND_BUTTON = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full';

type SheetComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled: boolean;
  sendDisabled: boolean;
};

export function InternalSheetComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  sendDisabled,
}: SheetComposerProps) {
  const palette = useSheetMessengerPalette();
  return (
    <div>
      <ComposerRow
        sendClass={palette.send}
        value={value}
        onChange={onChange}
        onSend={onSend}
        placeholder={placeholder}
        disabled={disabled}
        sendDisabled={sendDisabled}
      />
    </div>
  );
}

function ComposerRow({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  sendDisabled,
  sendClass,
}: SheetComposerProps & { sendClass: string }) {
  return (
    <div className={`flex items-center gap-2 ${SHEET_COMPOSER_GUTTER_CLASS} py-2`}>
      <button
        type="button"
        aria-label="Attach file"
        className={`${ROUND_BUTTON} border-border bg-card border`}
      >
        <img src={CLIP_ICON} alt="" className="dark:brightness-0 dark:invert" />
      </button>
      <MessageField
        value={value}
        onChange={onChange}
        onSend={onSend}
        placeholder={placeholder}
        disabled={disabled}
        sendDisabled={sendDisabled}
      />
      <button
        type="button"
        aria-label="Send message"
        onClick={onSend}
        disabled={disabled || sendDisabled}
        className={`${ROUND_BUTTON} disabled:cursor-not-allowed ${sendClass}`}
      >
        <img src={SEND_ICON} alt="" />
      </button>
    </div>
  );
}

function composerRowCount(value: string): number {
  const wrapped = value.split('\n').reduce((total, line) => {
    const width = Math.max(line.length, 1);
    return total + Math.ceil(width / SHEET_COMPOSER_WRAP_CHAR_COUNT);
  }, 0);
  return Math.min(SHEET_COMPOSER_MAX_ROWS, Math.max(1, wrapped));
}

function composerFieldClass(rows: number): string {
  const radius = SHEET_COMPOSER_RADIUS_BY_ROWS[rows - 1] ?? SHEET_COMPOSER_RADIUS_BY_ROWS[0];
  const height = rows > 1 ? 'min-h-10 py-1.5' : 'h-10';
  return `${SHEET_COMPOSER_FIELD_BASE_CLASS} ${height} ${radius}`;
}

function MessageField({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  sendDisabled,
}: SheetComposerProps) {
  const rows = composerRowCount(value);
  return (
    <div className={composerFieldClass(rows)}>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => onComposerKeyDown(event, disabled, sendDisabled, onSend)}
        placeholder={placeholder}
        disabled={disabled}
        className={SHEET_COMPOSER_TEXTAREA_CLASS}
      />
      <img src={STICKER_ICON} alt="" className="dark:brightness-0 dark:invert" />
    </div>
  );
}

function onComposerKeyDown(
  event: KeyboardEvent<HTMLTextAreaElement>,
  disabled: boolean,
  sendDisabled: boolean,
  onSend: () => void,
) {
  const submit = event.key === 'Enter' && !event.shiftKey;
  const chord = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
  if (!submit && !chord) return;
  event.preventDefault();
  if (!disabled && !sendDisabled) onSend();
}
