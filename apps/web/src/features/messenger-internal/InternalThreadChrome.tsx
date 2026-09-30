'use client';

import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import {
  MessengerThreadComposerRow,
  MessengerThreadDateDivider,
} from '@/features/messenger/messenger-thread-primitives';
import { InternalSheetComposer } from './InternalSheetComposer';
import { PresenceDot, useEmployeeOnline } from './PresenceAvatar';

export function ThreadAvatar({
  title,
  direct,
  employeeId,
}: {
  title: string;
  direct: boolean;
  employeeId?: string | null;
}) {
  const online = useEmployeeOnline(employeeId);
  const tone = direct
    ? 'border border-[#fcd34d] bg-[#fef3c7] text-[#92400e]'
    : 'bg-[#e0e7ff] text-[#4338ca]';
  return (
    <span
      className={`relative flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] ${tone}`}
    >
      {initialsFromDisplayName(title)}
      <PresenceDot online={online} />
    </span>
  );
}

export function FavoriteStar({ favorite, onToggle }: { favorite: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove from Favorites' : 'Add to Favorites'}
      onClick={onToggle}
      className={`flex size-4 shrink-0 items-center justify-center ${favorite ? 'rounded-full bg-[#eef2ff]' : ''}`}
    >
      <img src="/messenger/sheet-header-star.svg" alt="" />
    </button>
  );
}

export function MessageSelect({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return (
    <label className="mt-3 pl-2 opacity-0 group-hover:opacity-100 has-[:checked]:opacity-100">
      <span className="sr-only">Select message</span>
      <input type="checkbox" checked={selected} onChange={onToggle} className="accent-[#4f46e5]" />
    </label>
  );
}

export function MessageDate({ label, sheet }: { label: string; sheet: boolean }) {
  if (!sheet) return <MessengerThreadDateDivider label={label} />;
  return (
    <div className="mb-4 flex items-center gap-3 px-5">
      <div className="h-px flex-1 bg-[#e2e8f0]" />
      <span className="text-[11px] text-[#64748b]">{label}</span>
      <div className="h-px flex-1 bg-[#e2e8f0]" />
    </div>
  );
}

export function ComposerField({
  sheet,
  value,
  onChange,
  onSend,
  disabled,
  sendDisabled,
  placeholder,
  mentions,
  onMentionsChange,
}: {
  sheet: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  sendDisabled: boolean;
  placeholder: string;
  mentions?: Array<{ id: string; label: string }>;
  onMentionsChange?: (next: Array<{ id: string; label: string }>) => void;
}) {
  if (sheet) {
    return (
      <InternalSheetComposer
        value={value}
        onChange={onChange}
        onSend={onSend}
        disabled={disabled}
        sendDisabled={sendDisabled}
        placeholder={placeholder}
        mentions={mentions}
        onMentionsChange={onMentionsChange}
      />
    );
  }
  return (
    <MessengerThreadComposerRow
      value={value}
      onChange={onChange}
      onSend={onSend}
      disabled={disabled}
      sendDisabled={sendDisabled}
      placeholder={placeholder}
    />
  );
}
