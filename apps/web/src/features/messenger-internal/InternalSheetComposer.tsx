'use client';

import type { KeyboardEvent } from 'react';
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
    <div className="flex items-center gap-2 px-4 py-2">
      <button
        type="button"
        aria-label="Attach file"
        className={`${ROUND_BUTTON} border border-[#e2e8f0] bg-white`}
      >
        <img src={CLIP_ICON} alt="" />
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

function MessageField({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  sendDisabled,
}: SheetComposerProps) {
  return (
    <div className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-[#e2e8f0] bg-white px-4">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => onComposerKeyDown(event, disabled, sendDisabled, onSend)}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-sm leading-[21px] text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none disabled:opacity-50"
      />
      <img src={STICKER_ICON} alt="" />
    </div>
  );
}

function onComposerKeyDown(
  event: KeyboardEvent<HTMLInputElement>,
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
