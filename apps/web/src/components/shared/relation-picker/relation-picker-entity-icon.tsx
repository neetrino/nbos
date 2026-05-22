import type { ReactNode } from 'react';
import { Building2, FolderKanban, Handshake, Layers, User, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelationEntityKind } from './relation-picker.types';

const ICON_CLASS = 'text-muted-foreground size-8 shrink-0 rounded-lg bg-muted/60 p-1.5';

const ENTITY_ICONS: Record<RelationEntityKind, ReactNode> = {
  contact: <User size={16} className="mx-auto" />,
  company: <Building2 size={16} className="mx-auto" />,
  project: <FolderKanban size={16} className="mx-auto" />,
  partner: <Handshake size={16} className="mx-auto" />,
  product: <Layers size={16} className="mx-auto" />,
  employee: <UserCog size={16} className="mx-auto" />,
};

export function RelationPickerEntityIcon({
  kind,
  className,
}: {
  kind: RelationEntityKind;
  className?: string;
}) {
  return <span className={cn(ICON_CLASS, className)}>{ENTITY_ICONS[kind]}</span>;
}
