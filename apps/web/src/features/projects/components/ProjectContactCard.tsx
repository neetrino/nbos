'use client';

import { PersonContactRow } from '@/components/shared/PersonContactRow';
import { useEntityRelations } from '@/components/shared/relation-picker/entity-relations-context';

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

  return (
    <PersonContactRow
      name={contact.name}
      email={contact.email}
      isPrimary={contact.isPrimary}
      disabled={disabled}
      onOpen={() => {
        relations.openEntity('contact', contact.id, {
          onRemoveParticipant: () => onRemove(contact.id),
        });
      }}
    />
  );
}
