'use client';

import { initialsFromEmployeeLabel } from '@/components/shared/EmployeePersonAvatar';
import { PERSON_CONTACT_AVATAR_CLASS } from '@/components/shared/person-contact-row.constants';
import { PersonContactRow } from '@/components/shared/PersonContactRow';
import { employeeAvatarSoftColor } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';

type PersonSoftAvatarProps = {
  name: string;
  className?: string;
};

/** Soft pastel initials chip — Projects Contacts avatar language. */
export function PersonSoftAvatar({ name, className }: PersonSoftAvatarProps) {
  return (
    <span
      className={cn(
        PERSON_CONTACT_AVATAR_CLASS,
        'person-soft-avatar',
        employeeAvatarSoftColor(name),
        className,
      )}
      aria-hidden
    >
      {initialsFromEmployeeLabel(name)}
    </span>
  );
}

type PersonAvatarNameProps = {
  name: string;
  email?: string | null;
  isPrimary?: boolean;
  className?: string;
};

/**
 * Person display matching Projects → About → Contacts rows
 * (bordered card, soft avatar, name, optional email / Primary).
 */
export function PersonAvatarName({ name, email, isPrimary, className }: PersonAvatarNameProps) {
  return <PersonContactRow name={name} email={email} isPrimary={isPrimary} className={className} />;
}

export type PersonAvatarSize = 'sm' | 'md' | 'lg';
