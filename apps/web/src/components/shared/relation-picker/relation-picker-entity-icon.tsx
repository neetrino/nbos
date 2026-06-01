import type { ReactNode } from 'react';
import { Building2, FolderKanban, Handshake, Layers, User, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
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
