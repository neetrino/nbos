'use client';

import { cn } from '@/lib/utils';
import { EntityNotesField } from './entity-notes/EntityNotesField';
import { EntityNotesSection } from './entity-notes/EntityNotesSection';
import type { EntityNotesFieldProps } from './entity-notes/entity-notes-field.types';
import type { EntityNotesSectionProps } from './entity-notes/EntityNotesSection';
import {
  ENTITY_NOTES_OPTIONAL_PLACEHOLDER,
  isOptionalEntityNotesPlaceholder,
} from './entity-notes/entity-notes-optional-placeholder';
import { DETAIL_SHEET_OPTIONAL_DESCRIPTION_CLASS } from './detail-sheet-classes';

function optionalDescriptionPlacementClass(
  placeholder: string | undefined,
  className?: string,
): string | undefined {
  if (!isOptionalEntityNotesPlaceholder(placeholder)) return className;
  return cn(DETAIL_SHEET_OPTIONAL_DESCRIPTION_CLASS, className);
}

/** Description field for detail sheets — pinned to bottom when placeholder is optional. */
export function DetailSheetOptionalDescription({
  placeholder = ENTITY_NOTES_OPTIONAL_PLACEHOLDER,
  sectionClassName,
  ...props
}: EntityNotesSectionProps) {
  return (
    <EntityNotesSection
      {...props}
      placeholder={placeholder}
      sectionClassName={optionalDescriptionPlacementClass(placeholder, sectionClassName)}
    />
  );
}

/** Inline Description field variant — pinned to bottom when placeholder is optional. */
export function DetailSheetOptionalDescriptionField({
  placeholder = ENTITY_NOTES_OPTIONAL_PLACEHOLDER,
  className,
  ...props
}: EntityNotesFieldProps) {
  return (
    <EntityNotesField
      {...props}
      placeholder={placeholder}
      className={optionalDescriptionPlacementClass(placeholder, className)}
    />
  );
}
