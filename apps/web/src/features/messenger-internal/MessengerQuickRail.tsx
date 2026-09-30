'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import { MESSENGER_SIDEBAR_UNREAD_DISPLAY_MAX } from '@/features/messenger/messenger-sidebar.constants';

export const APP_MESSENGER_RIGHT_RAIL_WIDTH_PX = 72;

export type MessengerQuickRailPerson = {
  id: string;
  label: string;
  avatarUrl?: string;
  pinned?: boolean;
  unreadCount?: number;
};

export function MessengerQuickRail({
  people,
  activeId,
  onSelect,
  className = '',
}: {
  people: MessengerQuickRailPerson[];
  activeId: string | null;
  onSelect: (employeeId: string) => void;
  className?: string;
}) {
  const pinned = people.filter((person) => person.pinned);
  const rest = people.filter((person) => !person.pinned);
  return (
    <aside
      aria-label="Employees"
      className={`border-sidebar-border bg-sidebar hidden h-full w-[72px] shrink-0 flex-col items-center gap-3 overflow-y-auto border-l pt-3 lg:flex ${className}`}
    >
      {pinned.length > 0 ? (
        <>
          {pinned.map((person) => (
            <QuickAvatar
              key={person.id}
              person={person}
              active={person.id === activeId}
              onSelect={() => onSelect(person.id)}
            />
          ))}
          {rest.length > 0 ? <RailDivider /> : null}
        </>
      ) : null}
      {rest.map((person) => (
        <QuickAvatar
          key={person.id}
          person={person}
          active={person.id === activeId}
          onSelect={() => onSelect(person.id)}
        />
      ))}
    </aside>
  );
}

function RailDivider() {
  return <div aria-hidden className="my-0.5 h-px w-10 shrink-0 bg-[#e2e8f0]" />;
}

function QuickAvatar({
  person,
  active,
  onSelect,
}: {
  person: MessengerQuickRailPerson;
  active: boolean;
  onSelect: () => void;
}) {
  const photo = person.avatarUrl?.trim();
  const unread = person.unreadCount ?? 0;
  return (
    <button
      type="button"
      aria-label={unread > 0 ? `${person.label}, ${unread} unread` : person.label}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
      className={`relative rounded-full ${active ? 'ring-2 ring-[#a5b4fc] ring-offset-1' : ''}`}
    >
      <Avatar className="size-10 overflow-hidden" size="lg">
        {photo ? (
          <AvatarImage
            src={photo}
            alt={person.label}
            className="size-full max-h-full max-w-full object-cover"
          />
        ) : null}
        <AvatarFallback
          className={`text-xs text-[#334155] ${active ? 'bg-[#c7d2fe]' : 'bg-[#e2e8f0]'}`}
        >
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
      className="pointer-events-none absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] leading-4 font-semibold text-white tabular-nums shadow-sm"
    >
      {label}
    </span>
  );
}
