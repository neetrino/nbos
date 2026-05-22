'use client';

import type { ReactNode } from 'react';
import { DETAIL_SHEET_SECTION_BODY_CLASS } from '../detail-sheet-classes';
import { DetailSheetSection } from '../DetailSheetSection';
import { EntityNotesField } from './EntityNotesField';
import type { EntityNotesFieldProps } from './entity-notes-field.types';

export interface EntityNotesSectionProps extends EntityNotesFieldProps {
  id?: string;
  title?: string;
  icon?: ReactNode;
  sectionClassName?: string;
}

/** Detail sheet section + {@link EntityNotesField} (single “Notes” heading). */
export function EntityNotesSection({
  id,
  title = 'Notes',
  icon,
  sectionClassName,
  ...fieldProps
}: EntityNotesSectionProps) {
  return (
    <DetailSheetSection id={id} title={title} icon={icon} className={sectionClassName}>
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <EntityNotesField {...fieldProps} />
      </div>
    </DetailSheetSection>
  );
}
