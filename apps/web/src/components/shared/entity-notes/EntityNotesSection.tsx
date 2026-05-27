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
export function EntityNotesSection({
  id,
  title: _title,
  icon: _icon,
  sectionClassName,
  className,
  ...fieldProps
}: EntityNotesSectionProps) {
  return (
    <div id={id} className={cn(sectionClassName)}>
      <EntityNotesField {...fieldProps} className={className} />
    </div>
  );
}
