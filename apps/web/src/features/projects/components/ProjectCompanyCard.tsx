'use client';

import { Building2 } from 'lucide-react';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';
import { employeeAvatarSoftColor } from '@/features/hr/utils/employee-display';
import { cn } from '@/lib/utils';
import {
  SIDEBAR_PERSON_AVATAR_CLASS,
  SIDEBAR_PERSON_CARD_CLASS,
  SIDEBAR_PERSON_META_STACK_CLASS,
  SIDEBAR_PERSON_OPEN_BTN_CLASS,
  SIDEBAR_PERSON_ROLE_LABEL_CLASS,
} from './sidebar-person-card.constants';

interface ProjectCompanyCardProps {
  companyId: string;
  name: string;
  disabled?: boolean;
  onRemove: () => Promise<void>;
}

export function ProjectCompanyCard({
  companyId,
  name,
  disabled,
  onRemove,
}: ProjectCompanyCardProps) {
  const relations = useEntityRelations();
  const avatarTone = employeeAvatarSoftColor(name);

  const openCompany = () => {
    relations.openEntity('company', companyId, {
      onRemoveParticipant: () => onRemove(),
    });
  };

  return (
    <article className={cn(SIDEBAR_PERSON_CARD_CLASS, disabled && 'opacity-60')}>
      <button
        type="button"
        disabled={disabled}
        onClick={openCompany}
        className={cn(SIDEBAR_PERSON_OPEN_BTN_CLASS, 'shrink-0 rounded-full')}
        aria-label={`Open ${name}`}
      >
        <span className={cn(SIDEBAR_PERSON_AVATAR_CLASS, avatarTone)} aria-hidden>
          <Building2 className="size-4" />
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={openCompany}
        className={cn(SIDEBAR_PERSON_OPEN_BTN_CLASS, 'min-w-0 flex-1 rounded-md text-left')}
        aria-label={`Open ${name}`}
      >
        <span className="text-foreground block truncate text-sm font-semibold">{name}</span>
      </button>

      <div className={SIDEBAR_PERSON_META_STACK_CLASS}>
        <span className={SIDEBAR_PERSON_ROLE_LABEL_CLASS}>Company</span>
      </div>
    </article>
  );
}
