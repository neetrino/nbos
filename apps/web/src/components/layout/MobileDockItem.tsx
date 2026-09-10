import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  MOBILE_DOCK_ITEM_ACTIVE_CLASS,
  MOBILE_DOCK_ITEM_CLASS,
  MOBILE_DOCK_ITEM_DISABLED_CLASS,
  MOBILE_DOCK_ITEM_GLYPH_CLASS,
  MOBILE_DOCK_ITEM_IDLE_CLASS,
  MOBILE_DOCK_ITEM_LABEL_CLASS,
} from './mobile-bottom-nav-constants';

interface MobileDockItemProps extends ComponentPropsWithRef<'button'> {
  label: string;
  active?: boolean;
  caption?: ReactNode;
}

export function MobileDockItem({
  label,
  active = false,
  disabled = false,
  caption,
  className,
  children,
  ...props
}: MobileDockItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        MOBILE_DOCK_ITEM_CLASS,
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        disabled && 'text-muted-foreground/50',
        className,
      )}
      aria-label={label}
      {...props}
    >
      <span
        className={cn(
          MOBILE_DOCK_ITEM_GLYPH_CLASS,
          disabled
            ? MOBILE_DOCK_ITEM_DISABLED_CLASS
            : active
              ? MOBILE_DOCK_ITEM_ACTIVE_CLASS
              : MOBILE_DOCK_ITEM_IDLE_CLASS,
        )}
      >
        {children}
      </span>
      <span className={MOBILE_DOCK_ITEM_LABEL_CLASS}>{caption ?? label}</span>
    </button>
  );
}
