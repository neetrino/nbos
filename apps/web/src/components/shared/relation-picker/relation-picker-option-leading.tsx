'use client';

import type { ReactNode } from 'react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { RELATION_PICKER_ENTITY_ICON_INLINE_CLASS } from '../detail-sheet-classes';
import { RelationPickerEntityIcon } from './relation-picker-entity-icon';
import type { RelationEntityKind } from './relation-picker.types';

function usesPersonAvatar(kind: RelationEntityKind): boolean {
  return kind === 'contact' || kind === 'employee';
}

/** Leading icon/avatar for relation picker chips and dropdown rows. */
export function relationPickerOptionLeading(
  kind: RelationEntityKind,
  label: string,
  variant: 'boxed' | 'inline' = 'boxed',
): ReactNode {
  if (usesPersonAvatar(kind)) {
    return <EmployeePersonAvatar label={label} />;
  }
  if (variant === 'inline') {
    return (
      <RelationPickerEntityIcon
        kind={kind}
        variant="inline"
        className={RELATION_PICKER_ENTITY_ICON_INLINE_CLASS}
      />
    );
  }
  return <RelationPickerEntityIcon kind={kind} variant="boxed" />;
}
