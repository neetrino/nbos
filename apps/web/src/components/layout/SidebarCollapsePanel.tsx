'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  SIDEBAR_COLLAPSE_PANEL_CLASS,
  SIDEBAR_COLLAPSE_PANEL_CLOSED_CLASS,
  SIDEBAR_COLLAPSE_PANEL_INNER_CLASS,
  SIDEBAR_COLLAPSE_PANEL_OPEN_CLASS,
} from './sidebar-layout-constants';

/** Height-animates nested sidebar content open/closed. */
export function SidebarCollapsePanel({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        SIDEBAR_COLLAPSE_PANEL_CLASS,
        open ? SIDEBAR_COLLAPSE_PANEL_OPEN_CLASS : SIDEBAR_COLLAPSE_PANEL_CLOSED_CLASS,
        className,
      )}
      aria-hidden={!open}
    >
      <div className={SIDEBAR_COLLAPSE_PANEL_INNER_CLASS} {...(!open ? { inert: true } : {})}>
        {children}
      </div>
    </div>
  );
}
