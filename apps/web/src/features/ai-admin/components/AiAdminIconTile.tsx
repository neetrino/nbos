import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AI_ADMIN_ICON_TILE_CLASS,
  AI_ADMIN_ICON_TILE_LG_CLASS,
  AI_ADMIN_ICON_TILE_SM_CLASS,
} from '../ai-admin-ui.constants';

export function AiAdminIconTile(props: {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const Icon = props.icon;
  const tileClass =
    props.size === 'lg'
      ? AI_ADMIN_ICON_TILE_LG_CLASS
      : props.size === 'sm'
        ? AI_ADMIN_ICON_TILE_SM_CLASS
        : AI_ADMIN_ICON_TILE_CLASS;
  const iconClass = props.size === 'lg' ? 'size-6' : props.size === 'sm' ? 'size-4' : 'size-5';
  return (
    <div className={cn(tileClass, props.className)}>
      <Icon className={iconClass} aria-hidden />
    </div>
  );
}
