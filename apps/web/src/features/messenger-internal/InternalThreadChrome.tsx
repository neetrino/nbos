'use client';

import { Check, Pin } from 'lucide-react';
import {
  MessengerThreadComposerRow,
  MessengerThreadDateDivider,
} from '@/features/messenger/messenger-thread-primitives';
import { InternalSheetComposer } from './InternalSheetComposer';
import { MessengerPersonAvatar } from './MessengerPersonAvatar';

const FAVORITE_PIN_ACTIVE = 'fill-[#4f46e5] text-[#4f46e5]';
const FAVORITE_PIN_IDLE = 'text-[#94a3b8]';

export function ThreadAvatar({
  title,
  direct,
  employeeId,
}: {
  title: string;
  direct: boolean;
  employeeId?: string | null;
}) {
  const fallback = direct ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e0e7ff] text-[#4338ca]';
  return (
    <MessengerPersonAvatar
      employeeId={employeeId}
      label={title}
      sizeClassName="size-10"
      fallbackClassName={`text-[13px] ${fallback}`}
      roundedClassName={direct ? 'rounded-full border border-[#fcd34d]' : 'rounded-full'}
    />
  );
}

export function FavoriteStar({ favorite, onToggle }: { favorite: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove from Favorites' : 'Add to Favorites'}
      onClick={onToggle}
      className={`flex size-4 shrink-0 items-center justify-center transition-opacity ${
        favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
      }`}
    >
      <Pin size={14} className={favorite ? FAVORITE_PIN_ACTIVE : FAVORITE_PIN_IDLE} />
    </button>
  );
}

export function MessageSelect({
  selected,
  onToggle,
  selecting = false,
}: {
  selected: boolean;
  onToggle: () => void;
  selecting?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={selected ? 'Unselect message' : 'Select message'}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`mt-2 ml-2 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
      } ${selecting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
    >
      {selected ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
    </button>
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
}: {
  sheet: boolean;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  sendDisabled: boolean;
  placeholder: string;
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
