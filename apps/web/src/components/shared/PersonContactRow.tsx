'use client';

import type { ReactNode } from 'react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  RELATION_PICKER_PERSON_CHIP_AVATAR_CLASS,
  RELATION_PICKER_PERSON_CHIP_SHELL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import {
  PERSON_CONTACT_META_STACK_CLASS,
  PERSON_CONTACT_OPEN_BTN_CLASS,
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

function PersonContactIdentity({ name, email }: { name: string; email?: string | null }) {
  return (
    <span className="min-w-0 flex-1 overflow-hidden text-left">
      <span
        className={cn(
          'text-foreground block min-w-0 truncate text-sm font-semibold transition-colors',
          'group-focus-within/open:text-sky-700 group-hover/open:text-sky-700',
          'dark:group-hover/open:text-sky-300',
        )}
      >
        {name}
      </span>
      {email ? (
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">{email}</span>
      ) : null}
    </span>
  );
}

function PersonContactTrailing({
  isPrimary,
  trailing,
}: {
  isPrimary: boolean;
  trailing: ReactNode;
}) {
  if (!isPrimary && !trailing) return null;
  return (
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
  );
}

/**
 * Person row — same flush avatar + fading outline as relation employee chips.
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
  const openBody = (
    <>
      <EmployeePersonAvatar
        label={name}
        imageUrl={imageUrl}
        className={RELATION_PICKER_PERSON_CHIP_AVATAR_CLASS}
      />
      <PersonContactIdentity name={name} email={email} />
    </>
  );

  return (
    <div
      className={cn(
        RELATION_PICKER_PERSON_CHIP_SHELL_CLASS,
        'group/open h-auto min-h-10 gap-2 py-1',
        disabled && 'opacity-60',
        className,
      )}
    >
      {canOpen ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          className={cn(
            PERSON_CONTACT_OPEN_BTN_CLASS,
            'flex min-w-0 flex-1 items-center gap-2.5 overflow-visible text-left',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
          )}
          aria-label={`Open ${name}`}
        >
          {openBody}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-visible">{openBody}</div>
      )}
      <PersonContactTrailing isPrimary={isPrimary} trailing={trailing} />
    </div>
  );
}
