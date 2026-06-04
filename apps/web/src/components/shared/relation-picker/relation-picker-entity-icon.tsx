'use client';

import type { ReactNode } from 'react';
import { Building2, FolderKanban, Handshake, Layers, User, UserCog } from 'lucide-react';
import { EmployeePersonAvatar } from '@/components/shared/EmployeePersonAvatar';
import { cn } from '@/lib/utils';
import { RELATION_PICKER_ENTITY_ICON_INLINE_CLASS } from '../detail-sheet-classes';
import type { RelationEntityKind } from './relation-picker.types';

const ICON_BOXED_CLASS = 'text-muted-foreground size-8 shrink-0 rounded-lg bg-muted/60 p-1.5';

const ICON_SIZE = 16;

const ENTITY_ICON_COMPONENTS: Record<RelationEntityKind, typeof User> = {
  contact: User,
  company: Building2,
  project: FolderKanban,
  partner: Handshake,
  product: Layers,
  employee: UserCog,
};

function usesPersonAvatar(kind: RelationEntityKind): boolean {
  return kind === 'contact' || kind === 'employee';
}

export function RelationPickerEntityIcon({
  kind,
  variant = 'boxed',
  className,
}: {
  kind: RelationEntityKind;
  variant?: 'boxed' | 'inline';
  className?: string;
}) {
  const Icon = ENTITY_ICON_COMPONENTS[kind];
  if (variant === 'inline') {
    return <Icon size={ICON_SIZE} className={cn(className)} aria-hidden />;
  }
  return (
    <span className={cn(ICON_BOXED_CLASS, className)}>
      <Icon size={ICON_SIZE} className="mx-auto" aria-hidden />
    </span>
  );
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
