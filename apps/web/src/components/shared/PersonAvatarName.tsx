'use client';

import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { PERSON_CONTACT_AVATAR_CLASS } from '@/components/shared/person-contact-row.constants';
import { PersonContactRow } from '@/components/shared/PersonContactRow';
import { cn } from '@/lib/utils';

type PersonSoftAvatarProps = {
  name: string;
  className?: string;
  imageUrl?: string | null;
};

/** Soft pastel initials chip — Projects Contacts avatar language (photo when present). */
export function PersonSoftAvatar({ name, className, imageUrl }: PersonSoftAvatarProps) {
  return (
    <EmployeePersonAvatar
      label={name}
      imageUrl={imageUrl}
      className={cn(PERSON_CONTACT_AVATAR_CLASS, 'person-soft-avatar', className)}
    />
  );
}

type PersonAvatarNameProps = {
  name: string;
  email?: string | null;
  isPrimary?: boolean;
  className?: string;
  imageUrl?: string | null;
};

/**
 * Person display matching Projects → About → Contacts rows
 * (bordered card, soft avatar, name, optional email / Primary).
 */
export function PersonAvatarName({
  name,
  email,
  isPrimary,
  className,
  imageUrl,
}: PersonAvatarNameProps) {
  return (
    <PersonContactRow
      name={name}
      email={email}
      isPrimary={isPrimary}
      className={className}
      imageUrl={imageUrl}
    />
  );
}

export type PersonAvatarSize = 'sm' | 'md' | 'lg';
