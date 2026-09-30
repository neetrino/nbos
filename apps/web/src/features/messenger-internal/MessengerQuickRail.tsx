'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import { PresenceDot, useEmployeeOnline } from '@/features/messenger-internal/PresenceAvatar';

export const APP_MESSENGER_RIGHT_RAIL_WIDTH_PX = 64;

export type MessengerQuickRailPerson = {
  id: string;
  label: string;
  avatarUrl?: string;
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
  return (
    <aside
      aria-label="Employees"
      className={`border-sidebar-border bg-sidebar hidden h-full w-16 shrink-0 flex-col items-center gap-2.5 overflow-y-auto border-l pt-4 lg:flex ${className}`}
    >
      {people.map((person) => (
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

function QuickAvatar({
  person,
  active,
  onSelect,
}: {
  person: MessengerQuickRailPerson;
  active: boolean;
  onSelect: () => void;
}) {
  const online = useEmployeeOnline(person.id);
  const photo = person.avatarUrl?.trim();
  return (
    <button
      type="button"
      aria-label={person.label}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
      className={`relative rounded-full ${active ? 'ring-2 ring-[#a5b4fc] ring-offset-1' : ''}`}
    >
      <Avatar className="size-8" size="default">
        {photo ? <AvatarImage src={photo} alt={person.label} /> : null}
        <AvatarFallback
          className={`text-[10px] text-[#334155] ${active ? 'bg-[#c7d2fe]' : 'bg-[#e2e8f0]'}`}
        >
          {initialsFromDisplayName(person.label)}
        </AvatarFallback>
      </Avatar>
      <PresenceDot online={online} size="sm" />
    </button>
  );
}
