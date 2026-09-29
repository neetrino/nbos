'use client';

import type { KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

export function InternalSheetComposer({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
  sendDisabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  disabled: boolean;
  sendDisabled: boolean;
}) {
  return (
    <div className="bg-[#eef2ff]">
      <ComposerTip />
      <div className="flex items-center gap-2 px-4 py-2">
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => onComposerKeyDown(event, disabled, sendDisabled, onSend)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-14 min-w-0 flex-1 rounded-full border border-[#e2e8f0] bg-white px-5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          aria-label="Send message"
          onClick={onSend}
          disabled={disabled || sendDisabled}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-white disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function ComposerTip() {
  return (
    <p className="mx-5 mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-2xl bg-white px-3 py-1.5 text-xs text-[#0f172a] shadow-[0px_4px_2px_rgba(148,163,184,0.1)]">
      <span className="text-[#4f46e5]">Pro tip:</span>
      Type <Kbd>@</Kbd> to mention team members, <Kbd>/</Kbd> for quick NBOS commands
    </p>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded bg-[#f1f5f9] px-1 font-mono text-[10px] text-[#1e293b]">{children}</kbd>
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
