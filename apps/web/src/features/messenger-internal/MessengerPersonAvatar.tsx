'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initialsFromDisplayName } from '@/features/messenger/messenger-message-mapper';
import { PresenceDot, useEmployeeOnline } from './PresenceAvatar';
import { useEmployeeAvatarUrl } from './use-employee-avatar';

export function MessengerPersonAvatar({
  employeeId,
  label,
  sizeClassName = 'size-9',
  fallbackClassName,
  showPresence = false,
  roundedClassName = 'rounded-full',
}: {
  employeeId?: string | null;
  label: string;
  sizeClassName?: string;
  fallbackClassName: string;
  showPresence?: boolean;
  roundedClassName?: string;
}) {
  const photo = useEmployeeAvatarUrl(employeeId);
  const online = useEmployeeOnline(employeeId);
  return (
    <span className={`relative shrink-0 ${sizeClassName}`}>
      <Avatar className={`h-full w-full ${roundedClassName}`} size="default">
        {photo ? <AvatarImage src={photo} alt={label} /> : null}
        <AvatarFallback className={`${fallbackClassName} text-xs`}>
          {initialsFromDisplayName(label)}
        </AvatarFallback>
      </Avatar>
      {showPresence ? <PresenceDot online={online} /> : null}
    </span>
  );
}
