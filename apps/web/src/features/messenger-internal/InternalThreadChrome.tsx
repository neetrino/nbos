'use client';

import { Star } from 'lucide-react';
import {
  MessengerThreadComposerRow,
  MessengerThreadDateDivider,
} from '@/features/messenger/messenger-thread-primitives';
import { InternalSheetComposer } from './InternalSheetComposer';
import { MessengerPersonAvatar } from './MessengerPersonAvatar';

const FAVORITE_STAR_ACTIVE = 'fill-[#4f46e5] text-[#4f46e5]';
const FAVORITE_STAR_IDLE = 'text-[#94a3b8]';

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
      showPresence
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
      className="flex size-4 shrink-0 items-center justify-center"
    >
      <Star size={14} className={favorite ? FAVORITE_STAR_ACTIVE : FAVORITE_STAR_IDLE} />
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
