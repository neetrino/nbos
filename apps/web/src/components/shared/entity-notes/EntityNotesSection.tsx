'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { EntityNotesField } from './EntityNotesField';
import type { EntityNotesFieldProps } from './entity-notes-field.types';

export interface EntityNotesSectionProps extends EntityNotesFieldProps {
  id?: string;
  /** @deprecated Section heading removed — notes render as a single comment field. */
  title?: string;
  /** @deprecated Section heading removed — notes render as a single comment field. */
  icon?: ReactNode;
  sectionClassName?: string;
}

/** Inline notes field for detail sheets (no outer section card). */
export function EntityNotesSection(props: EntityNotesSectionProps) {
  const { id, sectionClassName, className, ...fieldProps } = props;
  delete (fieldProps as Partial<EntityNotesSectionProps>).title;
  delete (fieldProps as Partial<EntityNotesSectionProps>).icon;

  return (
    <div id={id} className={cn(sectionClassName)}>
      <EntityNotesField {...fieldProps} className={className} />
    </div>
  );
}
