'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from '@/features/messenger/messenger-sidebar.constants';
import { SIDEBAR_MODULE_VISUALS } from '@/components/layout/sidebar-module-visual';

export const APP_MESSENGER_RIGHT_RAIL_WIDTH_PX = 64;

export type MessengerQuickRailPerson = {
  id: string;
  label: string;
  avatarUrl?: string;
  pinned?: boolean;
  unreadCount?: number;
};

export type MessengerQuickRailShortcut = {
  id: 'messenger' | 'client-messenger';
  label: string;
  unreadCount: number;
  onSelect: () => void;
};

export function MessengerQuickRail({
  people,
  shortcuts,
  onSelect,
  className = '',
}: {
  people: MessengerQuickRailPerson[];
  shortcuts?: MessengerQuickRailShortcut[];
  onSelect: (employeeId: string) => void;
  className?: string;
}) {
  const pinned = people.filter((person) => person.pinned);
  const rest = people.filter((person) => !person.pinned);
  const hasShortcuts = (shortcuts?.length ?? 0) > 0;
  const hasPeople = people.length > 0;
  return (
    <aside
      aria-label="Employees"
      className={`border-sidebar-border bg-sidebar hidden h-full w-16 shrink-0 flex-col items-center gap-2.5 overflow-y-auto border-l pt-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {hasShortcuts
        ? shortcuts!.map((shortcut) => <RailShortcut key={shortcut.id} shortcut={shortcut} />)
        : null}
      {hasShortcuts && hasPeople ? <RailDivider /> : null}
      {pinned.length > 0 ? (
        <>
          {pinned.map((person) => (
            <QuickAvatar key={person.id} person={person} onSelect={() => onSelect(person.id)} />
          ))}
          {rest.length > 0 ? <RailDivider /> : null}
        </>
      ) : null}
      {rest.map((person) => (
        <QuickAvatar key={person.id} person={person} onSelect={() => onSelect(person.id)} />
      ))}
    </aside>
  );
}

function RailShortcut({ shortcut }: { shortcut: MessengerQuickRailShortcut }) {
  const { Icon, iconClass } = SIDEBAR_MODULE_VISUALS[shortcut.id];
  const unread = shortcut.unreadCount;
  const tone =
    shortcut.id === 'client-messenger'
      ? 'bg-teal-800/10 hover:bg-teal-800/15'
      : 'bg-purple-600/10 hover:bg-purple-600/15';
  return (
    <button
      type="button"
      aria-label={unread > 0 ? `${shortcut.label}, ${unread} unread` : shortcut.label}
      onClick={(event) => {
        shortcut.onSelect();
        event.currentTarget.blur();
      }}
      className={`relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#a5b4fc] focus-visible:ring-offset-1 ${tone}`}
    >
      <Icon className={iconClass} size={20} strokeWidth={1.85} aria-hidden />
      <RailUnreadBadge count={unread} />
    </button>
  );
}

function RailDivider() {
  return <div aria-hidden className="my-0.5 h-px w-10 shrink-0 bg-[#e2e8f0]" />;
}

function QuickAvatar({
  person,
  onSelect,
}: {
  person: MessengerQuickRailPerson;
  onSelect: () => void;
}) {
  const photo = person.avatarUrl?.trim();
  const unread = person.unreadCount ?? 0;
  return (
    <button
      type="button"
      aria-label={unread > 0 ? `${person.label}, ${unread} unread` : person.label}
      onClick={(event) => {
        onSelect();
        event.currentTarget.blur();
      }}
      className="relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#a5b4fc] focus-visible:ring-offset-1"
    >
      <Avatar className="size-10 overflow-hidden" size="lg">
        {photo ? (
          <AvatarImage
            src={photo}
            alt={person.label}
            className="size-full max-h-full max-w-full object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-[#e2e8f0] text-xs text-[#334155]">
          {initialsFromDisplayName(person.label)}
        </AvatarFallback>
      </Avatar>
      <RailUnreadBadge count={unread} />
    </button>
  );
}

function RailUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label =
    count > MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX
      ? `${MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX}+`
      : String(count);
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-1 -right-1 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-[#f8fafc]"
    >
      {label}
    </span>
  );
}
