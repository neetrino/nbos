'use client';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { initialsFromEmployeeLabel } from '@/components/shared/EmployeePersonAvatar';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { employeeAvatarSoftColor } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';
import {
  SIDEBAR_PERSON_AVATAR_CLASS,
  SIDEBAR_PERSON_CARD_CLASS,
  SIDEBAR_PERSON_META_STACK_CLASS,
  SIDEBAR_PERSON_OPEN_BTN_CLASS,
} from './sidebar-person-card.constants';

export type ProjectContactCardModel = {
  id: string;
  name: string;
  email: string | null;
  isPrimary: boolean;
};

interface ProjectContactCardProps {
  contact: ProjectContactCardModel;
  disabled?: boolean;
  onRemove: (contactId: string) => Promise<void>;
}

export function ProjectContactCard({ contact, disabled, onRemove }: ProjectContactCardProps) {
  const relations = useEntityRelations();
  const avatarTone = employeeAvatarSoftColor(contact.name);
  const initials = initialsFromEmployeeLabel(contact.name);

  const openContact = () => {
    relations.openEntity('contact', contact.id, {
      onRemoveParticipant: () => onRemove(contact.id),
    });
  };

  return (
    <article className={cn(SIDEBAR_PERSON_CARD_CLASS, disabled && 'opacity-60')}>
      <button
        type="button"
        disabled={disabled}
        onClick={openContact}
        className={cn(SIDEBAR_PERSON_OPEN_BTN_CLASS, 'shrink-0 rounded-full')}
        aria-label={`Open ${contact.name}`}
      >
        <span className={cn(SIDEBAR_PERSON_AVATAR_CLASS, avatarTone)} aria-hidden>
          {initials}
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={openContact}
        className={cn(SIDEBAR_PERSON_OPEN_BTN_CLASS, 'min-w-0 flex-1 rounded-md text-left')}
        aria-label={`Open ${contact.name}`}
      >
        <span className="text-foreground block truncate text-sm font-semibold">{contact.name}</span>
        {contact.email ? (
          <span className="text-muted-foreground mt-0.5 block truncate text-xs">
            {contact.email}
          </span>
        ) : null}
      </button>

      {contact.isPrimary ? (
        <div className={SIDEBAR_PERSON_META_STACK_CLASS}>
          <StatusBadge label="Primary" variant="green" dot className="rounded-full px-2 py-0.5" />
        </div>
      ) : null}
    </article>
  );
}
