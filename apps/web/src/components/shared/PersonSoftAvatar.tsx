'use client';

import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { PERSON_CONTACT_AVATAR_CLASS } from '@/components/shared/person-contact-row.constants';
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
