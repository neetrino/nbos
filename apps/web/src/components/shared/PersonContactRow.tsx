'use client';

import type { ReactNode } from 'react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  PERSON_CONTACT_AVATAR_CLASS,
  PERSON_CONTACT_META_STACK_CLASS,
  PERSON_CONTACT_OPEN_BTN_CLASS,
  PERSON_CONTACT_ROW_CLASS,
} from '@/components/shared/person-contact-row.constants';
import { cn } from '@/lib/utils';

export type PersonContactRowProps = {
  name: string;
  email?: string | null;
  isPrimary?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  className?: string;
  onOpen?: () => void;
  imageUrl?: string | null;
};

/**
 * Bordered person row — soft pastel initials/photo + name (+ email), as on
 * Projects → About → Contacts.
 */
export function PersonContactRow({
  name,
  email,
  isPrimary = false,
  disabled = false,
  trailing,
  className,
  onOpen,
  imageUrl,
}: PersonContactRowProps) {
  const canOpen = Boolean(onOpen) && !disabled;

  const avatar = (
    <EmployeePersonAvatar
      label={name}
      imageUrl={imageUrl}
      className={PERSON_CONTACT_AVATAR_CLASS}
    />
  );

  const identity = (
    <span className="min-w-0">
      <span className="text-foreground block truncate text-sm font-semibold">{name}</span>
      {email ? (
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">{email}</span>
      ) : null}
    </span>
  );

  return (
    <div className={cn(PERSON_CONTACT_ROW_CLASS, disabled && 'opacity-60', className)}>
      {canOpen ? (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={onOpen}
            className={cn(PERSON_CONTACT_OPEN_BTN_CLASS, 'shrink-0 rounded-full')}
            aria-label={`Open ${name}`}
          >
            {avatar}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onOpen}
            className={cn(PERSON_CONTACT_OPEN_BTN_CLASS, 'min-w-0 flex-1 rounded-md text-left')}
            aria-label={`Open ${name}`}
          >
            {identity}
          </button>
        </>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {avatar}
          {identity}
        </div>
      )}

      {isPrimary || trailing ? (
        <div
          className={PERSON_CONTACT_META_STACK_CLASS}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {isPrimary ? (
            <StatusBadge label="Primary" variant="green" dot className="rounded-full px-2 py-0.5" />
          ) : null}
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
